// src/lib/algorithm/state.ts

import { Buffer } from "node:buffer";

import { db } from "@tera/db/client";

import type { RankedPost } from "../types/algorithm";
import { scoreAndRankCandidates } from "./scoring";
import { getPostsByIds } from "./sourcing";

/**
 * Encode an array of ranked posts into a Base64 cursor string
 */
export function encodeState(posts: RankedPost[]): string {
  try {
    const postIds = posts.map((post) => post.id);
    const jsonString = JSON.stringify(postIds);
    return Buffer.from(jsonString).toString("base64url");
  } catch (error) {
    console.error("Error encoding state:", error);
    return "";
  }
}

/**
 * Decode a Base64 cursor string back into an array of post IDs
 */
export function decodeState(encodedState: string): string[] | null {
  try {
    const jsonString = Buffer.from(encodedState, "base64url").toString();
    const postIds = JSON.parse(jsonString);

    // Validate that we got an array of strings
    if (
      Array.isArray(postIds) &&
      postIds.every((id) => typeof id === "string")
    ) {
      return postIds;
    }

    return null;
  } catch (error) {
    console.error("Error decoding state:", error);
    return null;
  }
}

/**
 * Fetch posts from cached state and re-rank them with current scores
 */
export async function fetchPostsFromState(
  postIds: string[],
  userId: string,
): Promise<RankedPost[]> {
  if (postIds.length === 0) {
    return [];
  }

  try {
    // Use the centralized getPostsByIds function from sourcing
    // This ensures consistent data structure and includes all required fields
    const candidates = await getPostsByIds(db, postIds, userId);

    // Re-rank the posts with current scores to ensure proper ordering
    const rankedPosts = await scoreAndRankCandidates({
      candidates,
      userId,
    });

    return rankedPosts;
  } catch (error) {
    console.error("Error fetching posts from state:", error);
    return [];
  }
}
