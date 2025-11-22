"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { postQueryKeys, postQueryPredicate } from "~/lib/query-keys";
import type { RankedPost } from "@tera/utils/types";

export type CreateContentArgs = {
  // generic; will be forwarded to the mutation
  [k: string]: any;
};

export function useCreateContent({
  mutation, // trpc mutation function, e.g., trpc.post.add
  createOptimisticItem,
}: {
  mutation: any;
  createOptimisticItem: (args: CreateContentArgs) => RankedPost;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(mutation, {
    onMutate: async (variables: CreateContentArgs) => {
      const optimisticId = `temp-${Date.now()}`;

      const optimistic = createOptimisticItem({ ...variables, optimisticId });

      // optimistic patch: add to all feed caches
      try {
        const queries = queryClient.getQueryCache().findAll();
        for (const q of queries) {
          if (!postQueryPredicate(q)) continue;
          queryClient.setQueryData(q.queryKey as any, (prev: any) => {
            if (!prev || !prev.pages || prev.pages.length === 0) return prev;
            const newPages = [...prev.pages];
            newPages[0] = {
              ...newPages[0],
              posts: [optimistic, ...newPages[0].posts],
            };
            return { ...prev, pages: newPages };
          });
        }
      } catch (e) {
        // ignore; fallback to invalidation later
      }

      return { optimisticId };
    },
    onError: (err, variables, ctx: any) => {
      // rollback optimistic
      const optimisticId = ctx?.optimisticId;
      if (!optimisticId) return;
      const queries = queryClient.getQueryCache().findAll();
      for (const q of queries) {
        if (!postQueryPredicate(q)) continue;
        queryClient.setQueryData(q.queryKey as any, (prev: any) => {
          if (!prev?.pages) return prev;
          const pages = prev.pages.map((page: any) => ({
            ...page,
            posts: page.posts.filter((p: any) => p.id !== optimisticId),
          }));
          return { ...prev, pages };
        });
      }
    },
    onSuccess: async (data: any, variables, ctx: any) => {
      // Replace optimistic with server data
      const queries = queryClient.getQueryCache().findAll();
      for (const q of queries) {
        if (!postQueryPredicate(q)) continue;
        queryClient.setQueryData(q.queryKey as any, (prev: any) => {
          if (!prev?.pages) return prev;
          const newPages = prev.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: any) =>
              p.id === ctx?.optimisticId ? (data?.post ?? p) : p,
            ),
          }));
          return { ...prev, pages: newPages };
        });
      }

      // Invalidate as a fallback
      queryClient.invalidateQueries({ predicate: postQueryPredicate });
    },
  });

  // Generic create wrapper exposing the optimistic ID
  const createContent = useCallback(
    async (args: CreateContentArgs) => {
      return createMutation.mutateAsync(args);
    },
    [createMutation],
  );

  return {
    createContent,
    isCreating: createMutation.isLoading,
    error: createMutation.error,
  };
}
