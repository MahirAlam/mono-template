"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MediaPayloadItem } from "@tera/utils/types";
import { MAX_POST_FETCH_LIMIT } from "@tera/config";
import { RankedPost } from "@tera/utils/types";

import { useSession } from "~/hooks/useAuth";
import { postQueryPredicate } from "~/lib/query-keys";
import { useTRPC } from "~/trpc/react";

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
  const queryClient = useQueryClient();

  // Create post mutation
  const createPostMutation = useMutation(
    trpc.post.add.mutationOptions({
      onSuccess: async ({ post }, _variables) => {
        // await utils.post.getFeed.cancel();

        // Replace optimistic post with real post data in all relevant feeds
        if (post) {
          // Helper function to update feed if it exists
          const updateFeedIfExists = (feedKey: {
            limit: number;
            for: "feed" | "profile";
            userId?: string;
          }) => {
            const feedData = trpc.post.getFeed.

            // if (feedData) {
            //   utils.post.getFeed.setInfiniteData(feedKey, (prevData) => {
            //     if (!prevData) {
            //       return {
            //         pages: [
            //           {
            //             posts: [post],
            //             nextCursor: null,
            //           },
            //         ],
            //         pageParams: [null],
            //       };
            //     }

            //     const newPages = [...prevData.pages];
            //     if (newPages[0]) {
            //       // Remove optimistic posts and add real post
            //       const filteredPosts = newPages[0].posts.filter(
            //         (p) => !p.id.startsWith("temp-"),
            //       );
            //       newPages[0] = {
            //         ...newPages[0],
            //         posts: [post, ...filteredPosts],
            //       };
            //     }

            //     return {
            //       ...prevData,
            //       pages: newPages,
            //     };
            //   });
            //   return true;
            // }
            return false;
          };

          // Update home feed if it exists
          updateFeedIfExists({
            limit: MAX_POST_FETCH_LIMIT,
            for: "feed",
          });

          // Update author's profile feed if it exists
          updateFeedIfExists({
            limit: MAX_POST_FETCH_LIMIT,
            for: "profile",
            userId: post.author.id,
          });
        }

        // Invalidate related queries
        // utils.hashtag.getPopular.invalidate();
        // utils.user.getForMention.invalidate();
      },
    }),
  );

  // Create post with optimistic updates
  const createPost = useCallback(
    async (postData: PostCreationArgsType): ReturnPostCreationType => {
      const optimisticPostId = `temp-${Date.now()}`;
      const addedToFeeds: Array<{
        limit: number;
        for: "feed" | "profile";
        userId?: string;
      }> = [];

      try {
        // Create optimistic post for immediate UI feedback with all media types
        // Must match RankedPost type structure - cast as RankedPost to satisfy TypeScript

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

        const linkPreview =
          postData.media.find((m) => m.type === "link") || null;

        const optimisticPost: RankedPost = {
          reactionCount: 0,
          commentCount: 0,
          currentUserReactionId: null,
          hashtags:
            postData.hashtags.length > 0
              ? postData.hashtags.map((tag) => ({
                  id: `temp-${tag}`,
                  tag,
                }))
              : [],
          shareCount: 0,
          media,
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

        // Helper function: add optimistic post to any cached feed queries
        const addOptimisticPostToFeedIfExists = (feedKey: {
          limit: number;
          for: "feed" | "profile";
          userId?: string;
        }) => {
          const matchedQueries = queryClient
            .getQueryCache()
            .findAll()
            .filter(postQueryPredicate);

          let patched = false;
          for (const q of matchedQueries) {
            try {
              queryClient.setQueryData(q.queryKey as any, (prev: any) => {
                if (!prev || !prev.pages || prev.pages.length === 0)
                  return prev;
                const newPages = [...prev.pages];
                newPages[0] = {
                  ...newPages[0],
                  posts: [optimisticPost, ...newPages[0].posts],
                };
                patched = true;
                return { ...prev, pages: newPages };
              });
            } catch (e) {
              // ignore
            }
          }

          if (patched) {
            addedToFeeds.push(feedKey);
            return true;
          }
          return false;
        };

        // Add optimistic post to feeds and track which ones were updated
        const homeFeedKey = {
          limit: MAX_POST_FETCH_LIMIT,
          for: "feed" as const,
        };

        const profileFeedKey = {
          limit: MAX_POST_FETCH_LIMIT,
          for: "profile" as const,
          userId: user?.id || "current-user",
        };

        addOptimisticPostToFeedIfExists(homeFeedKey);
        addOptimisticPostToFeedIfExists(profileFeedKey);

        // Send to server with all the data including media, hashtags, mentions
        // Include optimisticId for server-side dedup on client retry
        const result = await createPostMutation.mutateAsync({
          content: postData.content,
          media: postData.media || [],
          visibilityId: postData.visibilityId,
          visibilityRule: postData.visibilityRule,
          hashtags: postData.hashtags || [],
          mentions: postData.mentions || [],
          optimisticId: optimisticPostId,
        });

        // Transfer any optimistic reactions from temp post to real post
        if (result.post) {
          // Use Zustand store to transfer reactions
          // const { transferReaction } = optimisticReactionsStore.getState();
          // transferReaction(optimisticPostId, result.post.id);

          // Log successful post creation and reaction transfer
          console.warn(
            `Post created successfully: ${optimisticPostId} -> ${result.post.id}`,
          );
        }

        // Return success result
        // on success, replace optimistic items in any cached feeds
        try {
          const queries = queryClient.getQueryCache().findAll();
          for (const q of queries) {
            if (!postQueryPredicate(q)) continue;
            queryClient.setQueryData(q.queryKey as any, (prev: any) => {
              if (!prev || !prev.pages) return prev;
              const newPages = prev.pages.map((page: any) => ({
                ...page,
                posts: page.posts.map((p: any) =>
                  p.id === optimisticPostId ? result.post : p,
                ),
              }));
              return { ...prev, pages: newPages };
            });
          }
        } catch (e) {
          // fallback: invalidate queries
          queryClient.invalidateQueries({
            predicate: postQueryPredicate,
          });
        }

        return {
          success: true,
          post: result.post as RankedPost,
          optimisticPostId,
        };
      } catch (error) {
        console.error("Failed to create post:", error);

        if (addedToFeeds.length > 0) {
          // Remove optimistic posts from all post-related cached queries
          try {
            const queries = queryClient.getQueryCache().findAll();
            for (const q of queries) {
              if (!postQueryPredicate(q)) continue;
              queryClient.setQueryData(q.queryKey as any, (prev: any) => {
                if (!prev?.pages) return prev;
                const pages = prev.pages.map((page: any) => ({
                  ...page,
                  posts: page.posts.filter(
                    (p: any) => p.id !== optimisticPostId,
                  ),
                }));
                return { ...prev, pages };
              });
            }
          } catch (e) {
            queryClient.invalidateQueries({
              predicate: postQueryPredicate,
            });
          }
        }

        // Return error result
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create post",
          optimisticPostId,
        };
      }
    },
    [
      createPostMutation,
      // utils.post.getFeed,
      user?.id,
      user?.name,
      user?.image,
      user?.username,
    ],
  );

  return {
    createPost,
    isCreating: createPostMutation.isPending,
    error: createPostMutation.error,
  };
}
