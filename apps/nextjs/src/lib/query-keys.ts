/**
 * Typed query key helpers for feed and post queries.
 * Replaces heuristic string matching with explicit, type-safe query key definitions.
 * Aligns with tRPC's queryKey structure for optimal type safety.
 */

/**
 * Define query keys for post-related queries
 * Following the pattern: ['trpc', procedurePath, { input }]
 */
export const postQueryKeys = {
  getFeed: {
    all: ["trpc", "post", "getFeed"] as const,
    infinite: (limit: number) =>
      [...postQueryKeys.getFeed.all, { limit, type: "infinite" }] as const,
    infiniteWithCursor: (limit: number, cursor: string | null | undefined) =>
      [
        ...postQueryKeys.getFeed.all,
        { limit, cursor, type: "infinite" },
      ] as const,
  },
};

/**
 * Check if a query key matches the post feed infinite query pattern
 */
export function isPostFeedInfiniteQuery(
  queryKey: readonly unknown[],
): queryKey is typeof postQueryKeys.getFeed.all {
  if (queryKey.length < 3) return false;
  const [, proc, operation] = queryKey;
  return proc === "post" && operation === "getFeed";
}

/**
 * Check if a query key is any post-related query
 */
export function isPostRelatedQuery(queryKey: readonly unknown[]): boolean {
  if (queryKey.length < 2) return false;
  const [, proc] = queryKey;
  return proc === "post";
}

/**
 * Safe predicate for filtering query cache by post-related queries
 */
export function postQueryPredicate(q: {
  queryKey: readonly unknown[];
}): boolean {
  return isPostRelatedQuery(q.queryKey);
}

/**
 * Safe predicate for filtering query cache by feed-related queries specifically
 */
export function feedQueryPredicate(q: {
  queryKey: readonly unknown[];
}): boolean {
  return isPostFeedInfiniteQuery(q.queryKey);
}
