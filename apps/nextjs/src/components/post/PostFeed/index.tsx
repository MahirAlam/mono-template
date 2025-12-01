"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";

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
  const parentRef = useRef<HTMLDivElement>(null);

  const input: GetFeedSchemaType = {
    limit: MAX_POST_FETCH_LIMIT,
    userId,
    feedFor,
  };

  const { data, hasNextPage, status, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery(
      trpc.post.getFeed.infiniteQueryOptions(input, {
        getNextPageParam: (last) => last.nextCursor ?? null,
        refetchOnWindowFocus: false, // Prevent jarring jumps when tabbing back
      }),
    );

  // Flatten posts with memoization
  const posts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) ?? [];
  }, [data?.pages]);

  // 🔥 Window Virtualizer
  const virtualizer = useVirtualizer({
    count: hasNextPage ? posts.length + 1 : posts.length,
    estimateSize: () => 300, // Slightly increased estimate for media cards
    getScrollElement: () =>
      typeof window !== "undefined"
        ? window.document.getElementById("main-body")
        : null,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
    getItemKey: (index) => {
      const post = posts[index];
      // Use post ID for posts, specific key for loader
      return post ? post.id : `feed-loader-${index}`;
    },
  });

  const virtualItems = virtualizer.getVirtualItems();

  // 🔥 Infinite scroll trigger
  useEffect(() => {
    if (!virtualItems.length) return;

    const lastItem = virtualItems[virtualItems.length - 1];

    // Check if we are near the end and valid to fetch
    if (
      lastItem &&
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

  if (status === "pending") {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-10 text-center text-red-500">
        Failed to load feed. Please try again.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-muted-foreground py-10 text-center">
        No posts found.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const index = virtualRow.index;
          const post = posts[index];
          const isLoaderRow = index > posts.length - 1;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-2 pb-4" // Padding between posts
            >
              {isLoaderRow ? (
                <div className="flex w-full justify-center py-4">
                  {hasNextPage ? (
                    <Loader2 className="text-muted-foreground size-6 animate-spin" />
                  ) : (
                    <div className="flex w-full items-center gap-4 py-4">
                      <div className="bg-border h-px flex-1" />
                      <span className="text-muted-foreground text-xs">
                        You&apos;re all caught up
                      </span>
                      <div className="bg-border h-px flex-1" />
                    </div>
                  )}
                </div>
              ) : post ? (
                <PostCard post={post} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PostFeed;
