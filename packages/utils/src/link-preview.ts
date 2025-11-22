"use server";

import ogs from "open-graph-scraper";

export type LinkPreviewData = {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
};

/**
 * Fetches Open Graph metadata for a given URL to generate a link preview.
 * @param url The URL to scrape.
 * @returns A promise that resolves to the link preview data or null on error.
 */
export async function getLinkPreview(
  url: string,
): Promise<LinkPreviewData | null> {
  try {
    const { result } = await ogs({ url });

    if (!result.success || !result.ogTitle) {
      return null;
    }

    return {
      url: result.ogUrl || url,
      title: result.ogTitle,
      description: result.ogDescription,
      imageUrl: result.ogImage?.[0]?.url,
    };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}