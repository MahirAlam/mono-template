/* Canonical post-related types used across client and server. */

import type { RankedPost } from "./algorithm";

export type DbMediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  altText?: string | null;
  order?: number;
};

export type DbLinkPreview = {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  position?: "first" | "last";
};

export type MediaPayloadItem = {
  type: "image" | "video" | "link";
  position?: "first" | "last";
  url: string;
  title?: string;
  description?: string;
  previewUrl?: string;
};

// A small alias for UI code — keep client staging state separate in UI layer
export type FrontendStagedMedia = Omit<RankedPost["media"][number], "id"> & {
  url: string;
  file?: File;
  remoteUrl?: string | null;
  status: "staged" | "uploading" | "failed" | "complete";
  progress: number;
  previewUrl?: string;
};
