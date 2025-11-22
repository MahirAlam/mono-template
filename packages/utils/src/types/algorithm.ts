// src/lib/algorithm/types.ts
import type { getCandidatePosts } from "../algorithm/sourcing";

// Infer the actual return type from the getCandidatePosts function
export type CandidatePost = Awaited<
  ReturnType<typeof getCandidatePosts>
>[number];

// Represents a post after it has been processed by the scoring module.
export type RankedPost = CandidatePost & {
  _score: number;
};

// A union of possible sources for a post, used for debugging and potential diversification.
export type PostSource = "FRIEND" | "TOPIC" | "TRENDING" | "DISCOVERY";

// Configuration for the algorithm sourcing
export type SourcingConfig = {
  userId: string;
  poolSize: number;
};

// Configuration for the scoring algorithm
export type ScoringConfig = {
  candidates: CandidatePost[];
  userId: string;
};

// Feed result structure for user posts (with time-based scores)
export type FeedResult = {
  posts: RankedPost[];
  nextCursor: string | null;
};
