// src/lib/algorithm/config.ts

/**
 * The central configuration for the feed algorithm.
 * Adjusting these values will directly impact the content mix and ranking.
 */
export const algorithmConfig = {
  // --- Sourcing ---
  // The total number of unique posts to gather for ranking in a single run.
  // A larger pool means more variety but higher DB load.
  TOTAL_CANDIDATE_POOL_SIZE: 100,

  // Source distribution weights
  SOURCE_WEIGHTS: {
    FRIEND: 1.7,
    TOPIC: 1.2,
    TRENDING: 1.0,
    DISCOVERY: 1.0,
  },

  // --- Ranking & Scoring ---
  // These weights determine the value of different user interactions.
  SCORING_WEIGHTS: {
    REACTION: 1.0,
    COMMENT: 3.0,
    SHARE: 5.0,
  },
  // Controls how quickly a post's score decreases over time. Higher value = faster decay.
  TIME_DECAY_FACTOR: 1.8,

  // --- Pagination & State ---
  // The number of posts to return to the client per page.
  PAGE_SIZE: 20,
  // If the number of remaining cached posts is below this threshold,
  // the algorithm will perform a full re-fetch instead of using the cache.
  MIN_REMAINING_CANDIDATES_FOR_CACHE: 10,

  // --- Discovery & Serendipity ---
  // Configuration for injecting non-personalized content to prevent echo chambers.
  DISCOVERY_CONFIG: {
    // How many of the top posts from the last 48 hours to include in the candidate pool.
    TRENDING_POSTS_COUNT: 10,
    // How many highly-rated but random posts to include.
    RANDOM_POSTS_COUNT: 5,
    // Time window for trending posts (in hours)
    TRENDING_TIME_WINDOW_HOURS: 48,
  },

  // --- Diversification ---
  DIVERSIFICATION_CONFIG: {
    // Maximum posts from same author in a single page
    MAX_POSTS_PER_AUTHOR: 3,
    // Minimum time gap between posts from same author (in minutes)
    MIN_AUTHOR_GAP_MINUTES: 15,
    // Maximum consecutive posts from friends vs discovery content
    MAX_CONSECUTIVE_FRIEND_POSTS: 5,
  },

  // --- Affinity & Relationships ---
  AFFINITY_CONFIG: {
    // Base affinity score for friends
    FRIEND_BASE_AFFINITY: 50,
    // Maximum affinity bonus multiplier
    MAX_AFFINITY_MULTIPLIER: 2.0,
    // Minimum affinity score to consider
    MIN_AFFINITY_THRESHOLD: 1,
  },
};
