// src/lib/algorithm/index.ts
import { and, desc, eq, exists, gte, or, sql } from "drizzle-orm";

import { db } from "@tera/db/client";
import {
  commentTable,
  friendshipTable,
  postReactionTable,
  postTable,
} from "@tera/db/schema";

import type { FeedResult } from "../types/algorithm";
import { algorithmConfig } from "./config";
import { diversifyRankedFeed } from "./diversification";
import { scoreAndRankCandidates } from "./scoring";
import { getCandidatePosts } from "./sourcing";
import { decodeState, encodeState, fetchPostsFromState } from "./state";

/**
 * Get re-engagement feed for users who haven't been active recently
 * Returns the best posts from friends in the last week
 */
async function getReEngagementFeed(userId: string, limit: number) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get friend posts from the last week with high engagement
  const reEngagementPosts = await db.query.postTable.findMany({
    where: and(
      gte(postTable.createdAt, oneWeekAgo),
      // Only include posts from friends
      exists(
        db
          .select()
          .from(friendshipTable)
          .where(
            and(
              eq(friendshipTable.status, "accepted"),
              or(
                and(
                  eq(friendshipTable.userId, userId),
                  eq(friendshipTable.friendId, postTable.authorId),
                ),
                and(
                  eq(friendshipTable.userId, userId),
                  eq(friendshipTable.friendId, postTable.authorId),
                ),
              ),
            ),
          ),
      ),
    ),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
      media: true,
      hashtags: {
        with: {
          hashtag: {
            columns: {
              id: true,
              tag: true,
            },
          },
        },
      },
      linkPreview: true,
      reactions: true,
      comments: {
        columns: {
          id: true,
        },
      },
    },
    columns: {
      id: true,
      content: true,
      visibilityId: true,
      sharedPostId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      desc(sql`(
      (SELECT COUNT(*) FROM ${postReactionTable} WHERE ${postReactionTable.postId} = ${postTable.id}) * 1 +
      (SELECT COUNT(*) FROM ${commentTable} WHERE ${commentTable.postId} = ${postTable.id}) * 3
    )`),
    ],
    limit,
  });

  // Transform to include computed counts and score
  return reEngagementPosts.map((post) => ({
    ...post,
    reactionCount: post.reactions?.length || 0,
    commentCount: post.comments?.length || 0,
    currentUserReactionId: userId
      ? post.reactions?.find((r) => r.userId === userId)?.reactionId || null
      : null,
    shareCount: 0,
    hashtags: post.hashtags?.map((ph) => ph.hashtag) || [],
    media: post.media || [],
    linkPreview: post.linkPreview || null,
    _score: 999, // High score for re-engagement posts
  }));
}

/**
 * Main entry point for the feed algorithm
 * Orchestrates the entire pipeline: sourcing -> scoring -> pagination -> state management
 */
export async function getRankedFeed({
  userId,
  limit = algorithmConfig.PAGE_SIZE,
  userUpdatedAt,
  cursor,
}: {
  userId: string;
  userUpdatedAt: Date;
  limit?: number;
  cursor?: string;
}): Promise<FeedResult> {
  try {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isReEngagementUser =
      userUpdatedAt &&
      Date.now() - new Date(userUpdatedAt).getTime() > SEVEN_DAYS_MS;

    // For re-engagement users, provide a "best of" feed from friends
    if (isReEngagementUser && !cursor) {
      const reEngagementPosts = await getReEngagementFeed(userId, limit);

      return {
        posts: reEngagementPosts,
        nextCursor: null, // Single page for re-engagement
      };
    }

    let rankedCandidates: import("../types/algorithm").RankedPost[] | undefined;

    // Check for cursor and attempt to use cached state
    if (cursor) {
      const cachedPostIds = decodeState(cursor);

      if (
        cachedPostIds &&
        cachedPostIds.length >
          algorithmConfig.MIN_REMAINING_CANDIDATES_FOR_CACHE
      ) {
        rankedCandidates = await fetchPostsFromState(cachedPostIds, userId);
      }
    }

    // Run full pipeline if no cached state or cache is too small
    if (!rankedCandidates) {
      // Step 1: Source candidate posts from various channels
      const candidates = await getCandidatePosts({
        userId,
        poolSize: algorithmConfig.TOTAL_CANDIDATE_POOL_SIZE,
      });

      // Early return if no candidates found
      if (candidates.length === 0) {
        return {
          posts: [],
          nextCursor: null,
        };
      }

      // Step 2: Score and rank all candidates
      rankedCandidates = await scoreAndRankCandidates({
        candidates,
        userId,
      });
    }

    // Step 2.5: Diversify the ranked candidates to prevent monotonous feeds
    const diversifiedCandidates = diversifyRankedFeed(rankedCandidates);

    // Step 3: Paginate results
    const postsToShow = diversifiedCandidates.slice(0, limit);
    const remainingPosts = diversifiedCandidates.slice(limit);

    // Step 4: Generate next cursor if there are remaining posts
    const nextCursor =
      remainingPosts.length > 0 ? encodeState(remainingPosts) : null;

    return {
      posts: postsToShow,
      nextCursor,
    };
  } catch (error) {
    console.error("Error in getRankedFeed:", error);

    // Return empty feed on error to prevent crashes
    return {
      posts: [],
      nextCursor: null,
    };
  }
}

// Export all types and utilities for external use
export { algorithmConfig } from "./config";
export { getPostsByIds, getPostsByUserId } from "./sourcing";
