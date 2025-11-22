"use client";

import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";

import { MAX_POST_FETCH_LIMIT } from "@tera/config";
import { GetFeedSchemaType } from "@tera/validators";

import { useTRPC } from "~/trpc/react";
import PostCard from "./post-card";

interface PostFeedProps {
  feedFor: GetFeedSchemaType["feedFor"];
  userId?: string;
}

const PostFeed = ({ feedFor, userId }: PostFeedProps) => {
  const trpc = useTRPC();

  const input: GetFeedSchemaType = {
    limit: MAX_POST_FETCH_LIMIT,
    userId,
    feedFor,
  };

  const {
    data: AllPost,
    hasNextPage,
    error,
    status,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    trpc.post.getFeed.infiniteQueryOptions(input, {
      getNextPageParam: (last) => last.nextCursor ?? null,
    }),
  );

  const posts = (AllPost?.pages ?? []).flatMap((p) => p.posts);

  // ----------------------------
  // 🔥 The Window Virtualizer!
  // ----------------------------
  const virtualizer = useVirtualizer({
    count: hasNextPage ? posts.length + 1 : posts.length,
    estimateSize: () => 220,
    measureElement: (el) => el.getBoundingClientRect().height,
    getScrollElement: () => document.scrollingElement,
    overscan: 5,
    getItemKey: (index) => {
      const post = posts[index];
      return post ? post.id : `loader-${index}`;
    },
  });

  const virtualItems = virtualizer.getVirtualItems();

  // ----------------------------
  // 🔥 Infinite scroll trigger
  // ----------------------------
  useEffect(() => {
    if (virtualItems.length === 0) return;

    const lastItem = virtualItems[virtualItems.length - 1];

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= posts.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    posts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // ----------------------------
  // 🔥 Render
  // ----------------------------
  if (status === "pending") return <p>Loading...</p>;
  if (status === "error") return <p>Error: {error.message}</p>;

  return (
    <div
      style={{
        height: virtualizer.getTotalSize(),
        position: "relative",
      }}
      className="space-y-3"
    >
      {virtualItems.map((virtualRow) => {
        const index = virtualRow.index;
        const post = posts[index];
        const isLoaderRow = index > posts.length - 1;

        return (
          <div key={virtualRow.key} ref={virtualizer.measureElement}>
            {isLoaderRow ? (
              hasNextPage ? (
                <p className="py-4 text-center">Loading more...</p>
              ) : (
                <p className="py-4 text-center">Nothing more to load</p>
              )
            ) : post ? (
              <PostCard post={post} />
            ) : null}
          </div>
        );
      })}
      {isFetching && !isFetchingNextPage && (
        <div className="py-2 text-center">Background Updating...</div>
      )}
    </div>
  );
};

export default PostFeed;
