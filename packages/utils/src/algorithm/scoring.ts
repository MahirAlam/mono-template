// src/lib/algorithm/scoring.ts
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@tera/db/client";
import { userAffinityTable, userHashtagAffinityTable } from "@tera/db/schema";

import type { RankedPost, ScoringConfig } from "../types/algorithm";
import type { getCandidatePosts } from "./sourcing";
import { algorithmConfig } from "./config";

type CandidatePost = Awaited<ReturnType<typeof getCandidatePosts>>[number];

/**
 * Calculate time decay factor based on post age
 */
function calculateTimeDecay(createdAt: Date): number {
  const now = new Date();
  const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  // Apply exponential decay: newer posts get higher scores
  return Math.exp(-ageInHours / algorithmConfig.TIME_DECAY_FACTOR);
}

/**
 * Calculate base engagement score from interactions
 */
function calculateEngagementScore(post: CandidatePost): number {
  const { reactionCount, commentCount, shareCount } = post;
  const { REACTION, COMMENT, SHARE } = algorithmConfig.SCORING_WEIGHTS;

  return reactionCount * REACTION + commentCount * COMMENT + shareCount * SHARE;
}

/**
 * Main function to score and rank candidate posts
 */
export async function scoreAndRankCandidates({
  candidates,
  userId,
}: ScoringConfig): Promise<RankedPost[]> {
  if (candidates.length === 0) {
    return [];
  }

  try {
    // Get all unique author IDs and hashtag IDs from candidates
    const authorIds = Array.from(
      new Set(candidates.map((post) => post.author.id)),
    );
    const hashtagIds = Array.from(
      new Set(
        candidates.flatMap((post) => post.hashtags?.map((h) => h.id) || []),
      ),
    );

    // Fetch user affinity scores and hashtag affinity scores in parallel
    const [affinityScores, hashtagAffinityScores] = await Promise.all([
      // Get affinity scores for all authors
      db
        .select({
          targetUserId: userAffinityTable.targetUserId,
          score: userAffinityTable.score,
        })
        .from(userAffinityTable)
        .where(
          and(
            eq(userAffinityTable.sourceUserId, userId),
            inArray(userAffinityTable.targetUserId, authorIds),
          ),
        ),

      // Get hashtag affinity scores (future-proofed)
      hashtagIds.length > 0
        ? db
            .select({
              hashtagId: userHashtagAffinityTable.hashtagId,
              score: userHashtagAffinityTable.score,
            })
            .from(userHashtagAffinityTable)
            .where(
              and(
                eq(userHashtagAffinityTable.userId, userId),
                inArray(userHashtagAffinityTable.hashtagId, hashtagIds),
              ),
            )
        : Promise.resolve([]),
    ]);

    // Create lookup maps for quick access
    const affinityMap = new Map<string, number>();
    affinityScores.forEach((affinity) => {
      affinityMap.set(affinity.targetUserId, affinity.score);
    });

    const hashtagAffinityMap = new Map<string, number>();
    hashtagAffinityScores.forEach((affinity) => {
      hashtagAffinityMap.set(affinity.hashtagId, affinity.score);
    });

    // Score each candidate post using the enhanced formula
    const rankedPosts: RankedPost[] = candidates.map((post) => {
      // Base engagement score
      const engagementScore = calculateEngagementScore(post);

      // Time decay factor (newer posts score higher)
      const timeDecayFactor = calculateTimeDecay(post.createdAt);

      // Get user's affinity score for this post's author
      const userAffinityScore = affinityMap.get(post.author.id) || 0;

      // Calculate hashtag affinity score
      const postHashtagAffinity = (post.hashtags || []).reduce(
        (sum, hashtag) => {
          return sum + (hashtagAffinityMap.get(hashtag.id) || 0);
        },
        0,
      );

      // Calculate final score using the enhanced additive formula
      // finalScore = (engagementScore + userAffinityScore + postHashtagAffinity) / timeDecayFactor
      const finalScore =
        (engagementScore + userAffinityScore + postHashtagAffinity) /
        timeDecayFactor;

      return {
        ...post,
        _score: finalScore,
      };
    });

    // Sort by score in descending order (highest scores first)
    return rankedPosts.sort((a, b) => b._score - a._score);
  } catch (error) {
    console.error("Error in scoreAndRankCandidates:", error);
    // Return candidates with default score of 0 if scoring fails
    return candidates.map((post) => ({
      ...post,
      _score: 0,
    }));
  }
}
