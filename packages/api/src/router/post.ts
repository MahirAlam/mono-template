import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sql } from "@tera/db";
import { Transaction } from "@tera/db/client";
import {
  hashtagTable,
  linkPreviewTable,
  postHashtagTable,
  postMediaTable,
  postTable,
  postUserTagTable,
} from "@tera/db/schema";
import { algorithm } from "@tera/utils";
import { GetFeedSchema } from "@tera/validators";

import { getFeedResponse } from "../helpers/getFeedResponse";
import { protectedProcedure } from "../trpc";

// Input schemas
const MediaItemSchema = z.object({
  type: z.enum(["image", "video", "link"]),
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  previewUrl: z.string().optional(),
});

const CreatePostSchema = z.object({
  content: z.any(), // JSONContent from TipTap
  media: z.array(MediaItemSchema).default([]),
  visibilityId: z.string(),
  visibilityRule: z.array(z.string()),
  hashtags: z.array(z.string()).default([]),
  mentions: z.array(z.string()).default([]),
  optimisticId: z.string().optional(), // Client-side temp ID for idempotency
});

// In-memory dedup cache: tracks recently created posts by optimisticId
// to prevent duplicate post creation on client retry
const createPostDedupCache = new Map<
  string,
  { postId: string; timestamp: number }
>();

// Clean up old entries every 5 minutes (TTL: 1 hour for dedup)
setInterval(
  () => {
    const now = Date.now();
    const TTL_MS = 60 * 60 * 1000;
    for (const [key, value] of createPostDedupCache.entries()) {
      if (now - value.timestamp > TTL_MS) {
        createPostDedupCache.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export const postRouter = {
  getFeed: protectedProcedure
    .input(GetFeedSchema)
    .query(async ({ ctx, input }) => {
      const { limit, userId, feedFor, cursor } = input;

      try {
        if (feedFor === "profile") {
          const feed = await algorithm.getPostsByUserId({
            db: ctx.db,
            limit,
            cursor: cursor || undefined,
            direction: "newest",
            userId: userId || ctx.session.user.id,
            currentUserId: ctx.session.user.id,
          });
          if (!feed) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Feed not found",
            });
          }
          return feed;
        } else {
          const feed = await getFeedResponse({
            feedFor,
            userId: userId || ctx.session.user.id,
            limit,
            cursor,
            userUpdatedAt: ctx.session.user.updatedAt || new Date(),
          });

          if (!feed) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Feed not found",
            });
          }

          return feed;
        }
      } catch (error) {
        console.error("Error fetching feed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch feed",
        });
      }
    }),

  add: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        content,
        media,
        visibilityId,
        visibilityRule,
        hashtags,
        mentions,
        optimisticId,
      } = input;
      const user = ctx.session.user;

      // Check dedup cache: if client is retrying the same post, return cached result
      if (optimisticId && createPostDedupCache.has(optimisticId)) {
        const cached = createPostDedupCache.get(optimisticId)!;
        const [cachedPost] = await algorithm.getPostsByIds(
          ctx.db,
          [cached.postId],
          user.id,
        );

        if (cachedPost) {
          return {
            success: true,
            postId: cachedPost.id,
            post: {
              ...cachedPost,
              _score: 9999,
            },
          };
        }
      }

      try {
        const completePost = await ctx.db.transaction(
          async (tx: Transaction) => {
            // Insert the post
            const [newPost] = await tx
              .insert(postTable)
              .values({
                content,
                authorId: user.id,
                visibilityRule,
                visibilityId,
              })
              .returning();

            if (!newPost) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create post",
              });
            }

            // Handle media attachments (images and videos only)
            const mediaItems = media.filter(
              (item) => item.type === "image" || item.type === "video",
            );
            if (mediaItems.length > 0) {
              await tx.insert(postMediaTable).values(
                mediaItems.map((mediaItem, index) => ({
                  postId: newPost.id,
                  url: mediaItem.url,
                  type: mediaItem.type,
                  order: index,
                })),
              );
            }

            // Handle link previews separately
            const linkItems = media.filter((item) => item.type === "link");
            if (linkItems.length > 0) {
              // Only insert the first link preview (one per post)
              const linkItem = linkItems[0];

              if (!linkItem) {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Failed to create post",
                });
              }

              await tx.insert(linkPreviewTable).values({
                postId: newPost.id,
                url: linkItem.url,
                title: linkItem.title,
                description: linkItem.description,
                imageUrl: linkItem.previewUrl,
              });
            }

            // Handle hashtags
            if (hashtags.length > 0) {
              // Remove duplicates and normalize case
              const uniqueHashtags = Array.from(
                new Set(hashtags.map((tag) => tag.toLowerCase().trim())),
              ).filter((tag) => tag.length > 0);

              // Bulk upsert hashtags in a single operation
              const hashtagRecords = await tx
                .insert(hashtagTable)
                .values(
                  uniqueHashtags.map((tag) => ({
                    tag,
                    usageCount: 1,
                  })),
                )
                .onConflictDoUpdate({
                  target: hashtagTable.tag,
                  set: {
                    usageCount: sql`${hashtagTable.usageCount} + 1`,
                    updatedAt: new Date(),
                  },
                })
                .returning();

              // Link hashtags to post
              await tx.insert(postHashtagTable).values(
                hashtagRecords.map((hashtagTable) => ({
                  postId: newPost.id,
                  hashtagId: hashtagTable.id,
                })),
              );
            }

            // Handle mentions
            if (mentions.length > 0) {
              // Remove duplicate user mentions
              const uniqueMentions = Array.from(new Set(mentions));

              await tx.insert(postUserTagTable).values(
                uniqueMentions.map((userId) => ({
                  postId: newPost.id,
                  userId,
                })),
              );
            }

            const [createdPost] = await algorithm.getPostsByIds(
              tx,
              [newPost.id],
              ctx.session.user.id,
            );

            if (!createdPost) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to retrieve created post",
              });
            }

            return {
              ...createdPost,
              _score: 9999,
            };
          },
        );

        if (!completePost) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve created post",
          });
        }

        // Record in dedup cache for idempotency on client retry
        if (optimisticId) {
          createPostDedupCache.set(optimisticId, {
            postId: completePost.id,
            timestamp: Date.now(),
          });
        }

        return {
          success: true,
          postId: completePost.id,
          post: completePost,
        };
      } catch (error) {
        console.error("Error creating post:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });
      }
    }),
} satisfies TRPCRouterRecord;
