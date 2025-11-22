// src/lib/algorithm/diversification.ts
import type { getCandidatePosts } from './sourcing';

type RankedPost = Awaited<ReturnType<typeof getCandidatePosts>>[number] & { _score: number };

/**
 * Diversify the ranked feed to prevent monotonous content
 * Implements author diversity and content type variety
 */
export function diversifyRankedFeed(rankedPosts: RankedPost[]): RankedPost[] {
  if (rankedPosts.length <= 3) {
    return rankedPosts;
  }

  const diversifiedPosts: RankedPost[] = [];
  const recentAuthors: string[] = [];
  const maxRecentAuthors = 3; // Track last 3 authors
  
  // Create a working copy to avoid mutating the original array
  const remainingPosts = [...rankedPosts];
  
  while (remainingPosts.length > 0) {
    let selectedIndex = -1;
    
    // Try to find a post from an author not in recent authors
    for (let i = 0; i < remainingPosts.length; i++) {
      const post = remainingPosts[i];
      if (post && !recentAuthors.includes(post.author.id)) {
        selectedIndex = i;
        break;
      }
    }
    
    // If all remaining posts are from recent authors, take the highest scored one
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }
    
    // Move the selected post to diversified list
    const [selectedPost] = remainingPosts.splice(selectedIndex, 1);
    if (selectedPost) {
      diversifiedPosts.push(selectedPost);
      
      // Update recent authors tracking
      recentAuthors.unshift(selectedPost.author.id);
      if (recentAuthors.length > maxRecentAuthors) {
        recentAuthors.pop();
      }
    }
  }
  
  return diversifiedPosts;
}
