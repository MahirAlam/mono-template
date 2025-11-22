// src/lib/algorithm/sourcing.ts
import { and, asc, desc, eq, gt, gte, inArray, lt, sql } from "drizzle-orm";

import type { DbType, Transaction } from "@tera/db/client";
// src/lib/algorithm/sourcing.ts
import { db } from "@tera/db/client";
import {
  commentTable,
  friendshipTable,
  postHashtagTable,
  postReactionTable,
  postTable,
  userAffinityTable,
} from "@tera/db/schema";

import type {
  FeedResult,
  RankedPost,
  SourcingConfig,
} from "../types/algorithm";
import { algorithmConfig } from "./config";

/**
 * Get user's interest profile based on their affinity scores
 */
async function _getUserInterestProfile(
  tx: Transaction,
  userId: string,
): Promise<{
  friendAffinity: number;
  topicAffinity: number;
  discoveryAffinity: number;
}> {
  try {
    // Get all user affinity scores
    const affinityScores = await tx
      .select({
        targetUserId: userAffinityTable.targetUserId,
        score: userAffinityTable.score,
      })
      .from(userAffinityTable)
      .where(eq(userAffinityTable.sourceUserId, userId));

    // Get user's friend connections
    const friendIds = await tx
      .select({
        friendId: sql<string>`CASE 
          WHEN ${friendshipTable.userId} = ${userId} THEN ${friendshipTable.friendId}
          ELSE ${friendshipTable.userId}
        END`.as("friend_id"),
      })
      .from(friendshipTable)
      .where(
        and(
          eq(friendshipTable.status, "accepted"),
          sql`(${friendshipTable.userId} = ${userId} OR ${friendshipTable.friendId} = ${userId})`,
        ),
      );

    const friendIdSet = new Set(friendIds.map((f) => f.friendId));

    // Calculate affinity distribution
    let friendAffinitySum = 0;
    let nonFriendAffinitySum = 0;

    affinityScores.forEach(({ targetUserId, score }) => {
      if (friendIdSet.has(targetUserId)) {
        friendAffinitySum += score;
      } else {
        nonFriendAffinitySum += score;
      }
    });

    const totalAffinity = friendAffinitySum + nonFriendAffinitySum;

    if (totalAffinity === 0) {
      return {
        friendAffinity: 0.5,
        topicAffinity: 0.3,
        discoveryAffinity: 0.2,
      };
    }

    // Calculate ratios based on actual affinity data
    const friendRatio = Math.min(0.4, friendAffinitySum / totalAffinity);
    const topicRatio = Math.min(0.4, nonFriendAffinitySum / totalAffinity);

    return {
      friendAffinity: Math.max(0.2, friendRatio),
      topicAffinity: Math.max(0.2, topicRatio),
      discoveryAffinity: Math.max(0.1, 1 - friendRatio - topicRatio),
    };
  } catch (error) {
    console.error("Error getting user interest profile:", error);
    return {
      friendAffinity: 0.5,
      topicAffinity: 0.3,
      discoveryAffinity: 0.2,
    };
  }
}

/**
 * Get post IDs from user's friends (accepted friendships)
 */
async function _getFriendPostIds(
  tx: Transaction,
  userId: string,
  limit: number,
): Promise<string[]> {
  const friendPosts = await tx
    .select({ id: postTable.id })
    .from(postTable)
    .innerJoin(
      friendshipTable,
      and(
        eq(friendshipTable.status, "accepted"),
        sql`(${friendshipTable.userId} = ${userId} AND ${postTable.authorId} = ${friendshipTable.friendId}) OR 
            (${friendshipTable.friendId} = ${userId} AND ${postTable.authorId} = ${friendshipTable.userId})`,
      ),
    )
    .orderBy(desc(postTable.createdAt))
    .limit(Math.floor(limit * 0.4)); // 40% of allocation for friends

  return friendPosts.map((p) => p.id);
}

/**
 * Get post IDs based on user's topic interests (hashtags they've interacted with)
 */
async function _getTopicPostIds(
  tx: Transaction,
  userId: string,
  limit: number,
): Promise<string[]> {
  // Get hashtags from posts the user has reacted to or commented on
  const userInterestHashtags = await tx
    .selectDistinct({ hashtagId: postHashtagTable.hashtagId })
    .from(postHashtagTable)
    .innerJoin(postTable, eq(postTable.id, postHashtagTable.postId))
    .leftJoin(
      postReactionTable,
      and(
        eq(postReactionTable.postId, postTable.id),
        eq(postReactionTable.userId, userId),
      ),
    )
    .leftJoin(
      commentTable,
      and(
        eq(commentTable.postId, postTable.id),
        eq(commentTable.authorId, userId),
      ),
    )
    .where(
      sql`${postReactionTable.userId} IS NOT NULL OR ${commentTable.authorId} IS NOT NULL`,
    )
    .limit(10); // Top 10 hashtags user has interacted with

  if (userInterestHashtags.length === 0) {
    return [];
  }

  const hashtagIds = userInterestHashtags.map((h) => h.hashtagId);

  const topicPosts = await tx
    .select({ id: postTable.id })
    .from(postTable)
    .innerJoin(postHashtagTable, eq(postHashtagTable.postId, postTable.id))
    .where(
      and(
        inArray(postHashtagTable.hashtagId, hashtagIds),
        sql`${postTable.authorId} != ${userId}`, // Exclude user's own posts
      ),
    )
    .orderBy(desc(postTable.createdAt))
    .limit(Math.floor(limit * 0.3)); // 30% of allocation for topics

  return topicPosts.map((p) => p.id);
}

/**
 * Get trending post IDs (posts with high engagement in recent time window)
 */
async function _getTrendingPostIds(
  tx: Transaction,
  userId: string,
  limit: number,
): Promise<string[]> {
  const timeWindow = new Date();
  timeWindow.setHours(
    timeWindow.getHours() -
      algorithmConfig.DISCOVERY_CONFIG.TRENDING_TIME_WINDOW_HOURS,
  );

  const trendingPosts = await tx
    .select({
      id: postTable.id,
      engagementScore: sql<number>`
        (COUNT(DISTINCT ${postReactionTable.userId}) * ${algorithmConfig.SCORING_WEIGHTS.REACTION} + 
         COUNT(DISTINCT ${commentTable.id}) * ${algorithmConfig.SCORING_WEIGHTS.COMMENT})
      `.as("engagement_score"),
    })
    .from(postTable)
    .leftJoin(postReactionTable, eq(postReactionTable.postId, postTable.id))
    .leftJoin(commentTable, eq(commentTable.postId, postTable.id))
    .where(
      and(
        gte(postTable.createdAt, timeWindow),
        sql`${postTable.authorId} != ${userId}`, // Exclude user's own posts
      ),
    )
    .groupBy(postTable.id)
    .having(
      sql`(COUNT(DISTINCT ${postReactionTable.userId}) * ${algorithmConfig.SCORING_WEIGHTS.REACTION} + COUNT(DISTINCT ${commentTable.id}) * ${algorithmConfig.SCORING_WEIGHTS.COMMENT}) > 0`,
    )
    .orderBy(
      desc(
        sql`(COUNT(DISTINCT ${postReactionTable.userId}) * ${algorithmConfig.SCORING_WEIGHTS.REACTION} + COUNT(DISTINCT ${commentTable.id}) * ${algorithmConfig.SCORING_WEIGHTS.COMMENT})`,
      ),
    )
    .limit(limit || algorithmConfig.DISCOVERY_CONFIG.TRENDING_POSTS_COUNT);

  return trendingPosts.map((p) => p.id);
}

/**
 * Get random discovery post IDs for serendipity
 */
async function _getRandomPostIds(
  tx: Transaction,
  userId: string,
  limit: number,
): Promise<string[]> {
  const randomPosts = await tx
    .select({ id: postTable.id })
    .from(postTable)
    .where(sql`${postTable.authorId} != ${userId}`) // Exclude user's own posts
    .orderBy(sql`RANDOM()`)
    .limit(limit || algorithmConfig.DISCOVERY_CONFIG.RANDOM_POSTS_COUNT);

  return randomPosts.map((p) => p.id);
}

/**
 * Main function to get candidate posts from various sources
 */
export async function getCandidatePosts({ userId, poolSize }: SourcingConfig) {
  try {
    // Use single transaction for all database operations for better efficiency
    return await db.transaction(async (tx: Transaction) => {
      // Get user's interest profile to dynamically allocate sourcing
      const profile = await _getUserInterestProfile(tx, userId);

      // Calculate dynamic limits based on user's interests
      const friendLimit = Math.floor(poolSize * profile.friendAffinity);
      const topicLimit = Math.floor(poolSize * profile.topicAffinity);
      const discoveryLimit = poolSize - friendLimit - topicLimit;

      // Fetch post IDs from different sources in parallel with dynamic limits
      const [friendPostIds, topicPostIds, trendingPostIds, randomPostIds] =
        await Promise.all([
          _getFriendPostIds(tx, userId, friendLimit),
          _getTopicPostIds(tx, userId, topicLimit),
          _getTrendingPostIds(tx, userId, Math.floor(discoveryLimit * 0.7)),
          _getRandomPostIds(tx, userId, Math.floor(discoveryLimit * 0.3)),
        ]);

      // Combine and deduplicate post IDs
      const allPostIds = Array.from(
        new Set([
          ...friendPostIds,
          ...topicPostIds,
          ...trendingPostIds,
          ...randomPostIds,
        ]),
      );

      if (allPostIds.length === 0) {
        return [];
      }

      // Fetch full post data with counts and related data in a single efficient query
      const candidatePosts = await getPostsByIds(tx, allPostIds, userId);

      // Transform to include computed counts
      return candidatePosts;
    });
  } catch (error) {
    console.error("Error in getCandidatePosts:", error);
    return [];
  }
}

/**
 * Get posts by their IDs with complete data structure
 * Used for fetching cached posts from state management
 */
export async function getPostsByIds(
  db: Transaction | DbType,
  postIds: string[],
  userId: string,
) {
  if (postIds.length === 0) return [];

  try {
    const posts = await db.query.postTable.findMany({
      where: inArray(postTable.id, postIds),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        media: {
          columns: {
            id: true,
            url: true,
            type: true,
            altText: true,
            order: true,
          },
        },
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
        linkPreview: {
          columns: {
            id: true,
            url: true,
            title: true,
            description: true,
            position: true,
            imageUrl: true,
          },
        },
        reactions: {
          columns: {
            userId: true,
            reactionId: true,
          },
        },
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
    });

    // Transform to include computed counts and proper structure
    return posts.map((post) => ({
      ...post,
      reactionCount: post.reactions?.length || 0,
      commentCount: post.comments?.length || 0,
      currentUserReactionId: userId
        ? post.reactions?.find((r) => r.userId === userId)?.reactionId || null
        : null,
      hashtags: post.hashtags?.map((ph) => ph.hashtag) || [],
      shareCount: 0, // TODO: Implement share counting logic
      media: post.media || [],
      linkPreview: post.linkPreview || null,
    }));
  } catch (error) {
    console.error("Error in getPostsByIds:", error);
    return [];
  }
}

type GetPostsByUserIdProps = {
  db: Transaction | DbType;
  limit: number;
  cursor: string | undefined;
  direction: "newest" | "oldest";
  userId: string;
  currentUserId?: string;
};

/**
 * Get posts by user ID with pagination support for React Query infinite queries
 */
export async function getPostsByUserId({
  db,
  limit,
  cursor,
  direction,
  userId,
  currentUserId,
}: GetPostsByUserIdProps): Promise<FeedResult> {
  try {
    // Fetch one extra post to determine if there are more pages
    const posts = await db.query.postTable.findMany({
      where: cursor
        ? and(
            eq(postTable.authorId, userId),
            direction === "newest"
              ? lt(postTable.createdAt, new Date(cursor))
              : gt(postTable.createdAt, new Date(cursor)),
          )
        : eq(postTable.authorId, userId),
      orderBy:
        direction === "newest"
          ? desc(postTable.createdAt)
          : asc(postTable.createdAt),
      limit: limit + 1, // Fetch one extra to check for more pages
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        media: {
          columns: {
            id: true,
            url: true,
            type: true,
            altText: true,
            order: true,
          },
        },
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
        linkPreview: {
          columns: {
            id: true,
            url: true,
            title: true,
            description: true,
            position: true,
            imageUrl: true,
          },
        },
        reactions: {
          columns: {
            userId: true,
            reactionId: true,
          },
        },
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
    });

    // Check if there are more pages
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    // Generate next cursor from the last post's createdAt
    const nextCursor =
      hasMore && postsToReturn.length > 0
        ? postsToReturn[postsToReturn.length - 1]?.createdAt.toISOString()
        : null;

    // Transform to include computed counts and time-based scoring
    const now = new Date();
    const transformedPosts: RankedPost[] = postsToReturn.map((post) => {
      // Calculate time decay score based on post age
      const ageInHours =
        (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);
      const timeDecayScore = Math.exp(
        -ageInHours / algorithmConfig.TIME_DECAY_FACTOR,
      );

      // Base interaction score
      const reactionCount = post.reactions?.length || 0;
      const commentCount = post.comments?.length || 0;
      const shareCount = 0; // TODO: Implement share counting logic

      const interactionScore =
        reactionCount * algorithmConfig.SCORING_WEIGHTS.REACTION +
        commentCount * algorithmConfig.SCORING_WEIGHTS.COMMENT +
        shareCount * algorithmConfig.SCORING_WEIGHTS.SHARE;

      // Final score with time decay
      const finalScore = (1 + interactionScore) * timeDecayScore;

      return {
        ...post,
        reactionCount,
        commentCount,
        currentUserReactionId: currentUserId
          ? post.reactions?.find((r) => r.userId === currentUserId)
              ?.reactionId || null
          : null,
        hashtags: post.hashtags?.map((ph) => ph.hashtag) || [],
        shareCount,
        media: post.media || [],
        linkPreview: post.linkPreview || null,
        _score: finalScore,
      };
    });

    return {
      posts: transformedPosts,
      nextCursor: nextCursor || null,
    };
  } catch (error) {
    console.error("Error in getPostsByUserId:", error);
    return {
      posts: [],
      nextCursor: null,
    };
  }
}
