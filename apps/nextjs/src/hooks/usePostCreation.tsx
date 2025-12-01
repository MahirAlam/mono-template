"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback } from "react";
import { InfiniteData, useMutation } from "@tanstack/react-query";

import type { FeedResult, MediaPayloadItem } from "@tera/utils/types";
import { MAX_POST_FETCH_LIMIT } from "@tera/config";
import { RankedPost } from "@tera/utils/types";

import { useSession } from "~/hooks/useAuth";
import { toasts } from "~/lib/toasts";
import { getQueryClient, useTRPC } from "~/trpc/react";

export type ReturnPostCreationType = Promise<
  | {
      success: boolean;
      post: RankedPost;
      optimisticPostId: string;
      error?: undefined;
    }
  | {
      success: boolean;
      error: string;
      optimisticPostId: string;
      post?: undefined;
    }
>;

export type PostCreationArgsType = {
  content: JSONContent | null;
  media: MediaPayloadItem[];
  visibilityId: string;
  visibilityRule: string[];
  hashtags: string[];
  mentions: string[];
};

export function usePostCreation() {
  const trpc = useTRPC();
  const { user } = useSession();
  const queryClient = getQueryClient();

  // 1. Clean Mutation: Only handles the network request and side-effect invalidations (not feed updates)
  const createPostMutation = useMutation(
    trpc.post.add.mutationOptions({
      onSuccess: async () => {
        // Invalidate non-feed auxiliary data
        const getPopularHashtagsFilter = trpc.hashtag.getPopular.queryFilter();
        const getMentionFilter = trpc.user.getForMention.queryFilter();

        Promise.all([
          queryClient.invalidateQueries(getPopularHashtagsFilter),
          queryClient.invalidateQueries(getMentionFilter),
        ]);
      },
      onError: (error) => {
        console.error(error);
        toasts.destructive(error.message, {
          closeButton: true,
          duration: 5000,
        });
      },
    }),
  );

  // Helper to update specific feed caches
  const updateFeedCache = useCallback(
    (
      feedType: "home" | "profile",
      userId: string | undefined,
      action: "add" | "replace" | "remove",
      payload: { optimisticId: string; post: RankedPost },
    ) => {
      const feedQueryFilter = trpc.post.getFeed.infiniteQueryFilter({
        limit: MAX_POST_FETCH_LIMIT,
        feedFor: feedType,
        userId: userId,
      });

      // Cancel outgoing refetches so they don't overwrite our optimistic update
      queryClient.cancelQueries(feedQueryFilter);

      queryClient.setQueriesData<InfiniteData<FeedResult, string | null>>(
        feedQueryFilter,
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;

          const newPages = oldData.pages.map((page, pageIndex) => {
            // We usually only touch the first page for additions
            if (pageIndex === 0 && action === "add") {
              return {
                ...page,
                posts: [payload.post, ...page.posts],
              };
            }

            // For replace/remove, we scan all pages
            let newPosts = [...page.posts];

            if (action === "replace") {
              newPosts = newPosts.map((p) =>
                p.id === payload.optimisticId ? payload.post : p,
              );
            } else if (action === "remove") {
              newPosts = newPosts.filter((p) => p.id !== payload.optimisticId);
            }

            return {
              ...page,
              posts: newPosts,
            };
          });

          return {
            ...oldData,
            pages: newPages,
          };
        },
      );
    },
    [queryClient, trpc],
  );

  const createPost = useCallback(
    async (postData: PostCreationArgsType): ReturnPostCreationType => {
      const optimisticPostId = `temp-${Date.now()}`;

      // Prepare Optimistic Post Object
      const media = postData.media
        .map((m, index) => {
          if (m.type === "image" || m.type === "video") {
            return {
              id: `temp-media-${index}`,
              url: m.url,
              type: m.type,
              altText: null,
              order: index,
            };
          }
          return false;
        })
        .filter((m) => m !== false);

      const linkPreview = postData.media.find((m) => m.type === "link") || null;

      const optimisticPost: RankedPost = {
        reactionCount: 0,
        commentCount: 0,
        currentUserReactionId: null,
        hashtags: postData.hashtags.map((tag) => ({
          id: `temp-${tag}`,
          tag,
        })),
        shareCount: 0,
        media: media as any, // cast generic media to RankedPost media
        linkPreview: linkPreview
          ? {
              id: `temp-link-${optimisticPostId}`,
              description: linkPreview.description || null,
              url: linkPreview.url,
              title: linkPreview.title || null,
              imageUrl: linkPreview.previewUrl || null,
              position: linkPreview.position || "first",
            }
          : null,
        id: optimisticPostId,
        createdAt: new Date(),
        updatedAt: null,
        reactions: [],
        content: postData.content,
        visibilityId: postData.visibilityId,
        sharedPostId: null,
        comments: [],
        author: {
          id: user?.id || "current-user",
          name: user?.name || "You",
          image: user?.image || null,
          username: user?.username || null,
        },
        _score: 999999,
      };

      // Track which feeds we modified to rollback if needed
      const relevantFeeds = [
        { type: "home" as const, userId: undefined },
        { type: "profile" as const, userId: user?.id || "current-user" },
      ];

      // STEP 1: OPTIMISTIC UPDATE (ADD)
      // Add the temporary post to the feed immediately
      relevantFeeds.forEach((feed) => {
        updateFeedCache(feed.type, feed.userId, "add", {
          optimisticId: optimisticPostId,
          post: optimisticPost,
        });
      });

      try {
        // STEP 2: MUTATE
        // Send request to server
        const result = await createPostMutation.mutateAsync({
          content: postData.content,
          media: postData.media || [],
          visibilityId: postData.visibilityId,
          visibilityRule: postData.visibilityRule,
          hashtags: postData.hashtags || [],
          mentions: postData.mentions || [],
          optimisticId: optimisticPostId,
        });

        if (result.post) {
          // STEP 3: SUCCESS UPDATE (REPLACE)
          // Replace the optimistic post with the real server response
          relevantFeeds.forEach((feed) => {
            updateFeedCache(feed.type, feed.userId, "replace", {
              optimisticId: optimisticPostId,
              post: result.post as RankedPost,
            });
          });

          console.log(
            `Post created successfully: ${optimisticPostId} -> ${result.post.id}`,
          );

          return {
            success: true,
            post: result.post as RankedPost,
            optimisticPostId,
          };
        }

        // Fallback if API returns success but no post object (rare edge case)
        return {
          success: true,
          post: optimisticPost, // keep optimistic or refetch
          optimisticPostId,
        };
      } catch (error) {
        // STEP 4: ERROR HANDLING (REMOVE)
        // Rollback: Remove the optimistic post from feeds
        console.error("Failed to create post:", error);

        relevantFeeds.forEach((feed) => {
          updateFeedCache(feed.type, feed.userId, "remove", {
            optimisticId: optimisticPostId,
            post: optimisticPost,
          });
        });

        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create post",
          optimisticPostId,
        };
      }
    },
    [createPostMutation, user, updateFeedCache],
  );

  return {
    createPost,
    isCreating: createPostMutation.isPending,
    error: createPostMutation.error,
  };
}
