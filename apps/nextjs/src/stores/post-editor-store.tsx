import type { JSONContent } from "@tiptap/react";
import { batch, computed, observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { syncObservable } from "@legendapp/state/sync";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

// --- Types ---
// TODO: Replace these temporary DB types with the canonical types
// once the DB schema and algorithm are migrated into the monorepo.
// Import canonical types from shared utils package for strict typesafety
import type { MediaPayloadItem } from "@tera/utils/types";
import { MAX_MEDIA_ITEMS } from "@tera/config";

import ToastProgressBar from "~/components/post/create/toast-progress-bar";
import {
  PostCreationArgsType,
  ReturnPostCreationType,
} from "~/hooks/usePostCreation";
import {
  extractHashtags,
  extractMentions,
  jsonToText,
} from "~/lib/editor-utils";
import { optimizeMedia } from "~/lib/media-optimizer";
import { toasts } from "~/lib/toasts";
import { uploadFiles } from "~/lib/utils";

export type StagedMediaItem = {
  type: "image" | "video" | "link";
  url: string; // Blob URL for local files, remote URL for links
  file?: File;
  remoteUrl?: string; // Final URL from UploadThing or similar
  status: "staged" | "uploading" | "failed" | "complete";
  progress: number;
  previewUrl?: string;
  position?: "first" | "last";
  title?: string;
  description?: string;
};

type SubmissionStatus = "idle" | "uploading" | "saving" | "completed" | "error";
type EditorMode = "create" | "edit";

// This interface defines the shape of our state for strict typing.
interface PostEditorState {
  mode: EditorMode;
  postId: string | null;
  isModalOpen: boolean;
  content: JSONContent | null;
  media: StagedMediaItem[];
  visibilityId: string;
  uploadedMediaNames: Set<string>; // Track which files have been uploaded
  // Filter string coming from the visibility option (e.g. 'friends', 'specific-friends')
  // TODO: consider storing the selected visibility object instead of separate fields
  // visibilityFilter can be a simple string (eg. "public") or
  // an array of user/list ids when a selection is required.
  visibilityFilter: string[];
  submission: {
    status: SubmissionStatus;
    progress: number;
    currentTask: string;
    error: string;
    toastId: string | number | null;
  };
  uploadAbortController: AbortController | null; // Track abort controller for upload cancellation
}

// --- The Strictly Typed Initial State ---
const initialState: PostEditorState = {
  mode: "create",
  postId: `temp-id-${Date.now()}`,
  isModalOpen: false,
  content: null,
  media: [],
  visibilityId: "c38b216c-e522-4a60-8422-96f7c5053b87", // Default to Public
  uploadedMediaNames: new Set(),
  visibilityFilter: ["public"],
  submission: {
    status: "idle",
    progress: 0,
    currentTask: "",
    error: "",
    toastId: null,
  },
  uploadAbortController: null,
};

export const postEditorStore$ = observable<PostEditorState>({
  ...initialState,
});

const persistPostEditor = syncObservable(postEditorStore$, {
  persist: {
    name: "postEditorDraft",
    transform: {
      save: (value) => {
        // Copy state and strip media before persisting
        const toSave = { ...value } as Partial<PostEditorState>;
        // Remove media array contents so files/blobs are not persisted
        toSave.media = [];
        return toSave;
      },
    },
    plugin: ObservablePersistLocalStorage,
  },
});

// --- V3 Computed Observables ---
export const hasDraft$ = computed(() => {
  const content = postEditorStore$.content.get();
  const media = postEditorStore$.media.get();

  if (postEditorStore$.isModalOpen.get()) {
    postEditorStore$.isModalOpen.set(false);
  }

  const hasText = content ? jsonToText(content).length > 0 : false;
  return hasText || media.length > 0;
});

export const isSubmitting$ = computed(() => {
  const status = postEditorStore$.submission.status.get();
  return status === "uploading" || status === "saving";
});

// --- Actions ---
function openForCreate() {
  if (hasDraft$.get()) {
    toasts.info("You have a saved draft.", {
      action: {
        label: (
          <span className="text-card-foreground bg-success hover:bg-success/80 rounded-lg px-3 py-2 text-sm transition-all duration-300 hover:scale-105">
            Load Draft
          </span>
        ),
        onClick: () => {
          // Dismiss all other toasts before opening modal
          toast.dismiss();
          postEditorStore$.isModalOpen.set(true);
        },
      },
      position: "top-center",
      duration: 5000,
      cancel: {
        label: (
          <span className="text-destructive-foreground size-auto! bg-transparent transition-all duration-300 hover:scale-125 hover:bg-transparent">
            <IconTrash className="size-6 scale-115" />
          </span>
        ),
        onClick: () => {
          toasts.destructive("Are you sure?", {
            position: "top-center",
            action: {
              label: (
                <span className="text-card-foreground bg-destructive hover:bg-destructive/80 rounded-lg px-3 py-2 text-sm transition-all duration-300 hover:scale-105">
                  Yes, Discard
                </span>
              ),
              onClick: () => {
                // Dismiss all toasts before clearing draft
                toast.dismiss();
                clearDraft(true);
              },
            },
            cancel: {
              label: (
                <span className="text-success transition-all hover:scale-105">
                  Cancel
                </span>
              ),
              onClick: () => {
                // Dismiss all toasts before opening modal
                toast.dismiss();
                postEditorStore$.isModalOpen.set(true);
              },
            },
          });
        },
      },
    });
  } else {
    batch(() => {
      postEditorStore$.mode.set("create");
      postEditorStore$.postId.set(null);
      postEditorStore$.isModalOpen.set(true);
    });
  }
}

function close() {
  postEditorStore$.isModalOpen.set(false);
}

function clearDraft(andOpen = false) {
  // Dismiss all toasts before clearing
  toast.dismiss();
  reset();

  if (andOpen) {
    openForCreate();
  }
  toasts.success("Draft discarded.");
}

async function addStagedMediaItem(files: File[]) {
  const optimizedFiles = await Promise.all(
    files.map(async (file) => {
      try {
        return await optimizeMedia(file);
      } catch (error) {
        console.warn("Media optimization failed, using original:", error);
        return file;
      }
    }),
  );

  const newMedia: StagedMediaItem[] = optimizedFiles.map((file) => ({
    type: file.type.startsWith("image") ? "image" : "video",
    url: URL.createObjectURL(file),
    file,
    status: "staged",
    progress: 0,
  }));

  postEditorStore$.media.set((current) =>
    [...current, ...newMedia].slice(0, MAX_MEDIA_ITEMS),
  );
}

function removeStagedMedia(url: string) {
  postEditorStore$.media.set((current) =>
    current.filter((item) => item.url !== url),
  );
}

function reorderStagedMedia(reorderedMedia: StagedMediaItem[]) {
  postEditorStore$.media.set(reorderedMedia);
}

async function initiateSubmission({
  createPost,
}: {
  createPost: (data: PostCreationArgsType) => ReturnPostCreationType;
}) {
  const {
    mode,
    media,
    uploadedMediaNames: uploadedNames,
    content,
    postId,
    visibilityFilter,
    visibilityId,
  } = postEditorStore$.get();
  // Prevent duplicate submissions
  const status = postEditorStore$.submission.status.get();
  if (status === "uploading" || status === "saving") {
    toasts.warning("Submission already in progress");
    return;
  }
  const toastId = toasts.loading(
    <ToastProgressBar progress={5} task="Preparing submission..." />,
    { duration: 1_000_000 },
  );

  batch(() => {
    postEditorStore$.isModalOpen.set(false);
    postEditorStore$.submission.set({
      status: "uploading",
      progress: 5,
      currentTask: "Preparing submission...",
      error: "",
      toastId: toastId,
    });
  });

  let imageInfo: { ufsUrl: string; name: string }[] = [];

  try {
    // Quick network availability guard
    if (typeof window !== "undefined" && !navigator.onLine) {
      const err =
        "You're currently offline — check your connection and try again.";
      postEditorStore$.submission.set((s) => ({
        ...s,
        status: "error",
        currentTask: "Offline",
        error: err,
      }));
      toasts.destructive("Offline", { description: err, id: toastId });
      // Try to re-open the modal on network restoration
      window.addEventListener(
        "online",
        () => {
          toasts.info("Connection restored — you can retry the post.");
        },
        { once: true },
      );
      return;
    }
    if (media.length > 0) {
      await new Promise((res) => setTimeout(res, 1000));

      const filesToUpload = media
        .map((m) => m.file!)
        .filter(
          (f): f is File =>
            f !== undefined &&
            f.type.startsWith("image") &&
            !uploadedNames.has(f.name), // Skip already-uploaded files
        );

      postEditorStore$.submission.currentTask.set(
        filesToUpload.length > 0
          ? `Uploading ${filesToUpload.length} images...`
          : "Processing media...",
      );

      // Upload only the files that haven't been uploaded yet
      // Create abort controller to allow cancellation on disconnect
      const uploadAbortController = new AbortController();
      postEditorStore$.uploadAbortController.set(uploadAbortController);

      // Cancel upload if network goes down
      const handleOffline = () => {
        uploadAbortController.abort();
        postEditorStore$.submission.set((s) => ({
          ...s,
          status: "error",
          currentTask: "Upload cancelled - offline",
          error: "Connection lost during upload",
        }));
      };
      window.addEventListener("offline", handleOffline);

      if (filesToUpload.length > 0) {
        const image = await uploadFiles("imageUploader", {
          files: filesToUpload,
          onUploadProgress: ({ progress }) => {
            const pg = 25 + Math.floor((progress / 100) * 65);
            postEditorStore$.submission.progress.set(pg);

            toasts.loading(
              <ToastProgressBar
                progress={pg}
                task={`Uploading ${filesToUpload.length} media...`}
              />,
              { id: toastId },
            );
          },
        }).catch((uploadErr) => {
          // Check if abort was intentional
          if (uploadAbortController.signal.aborted) {
            console.warn("Upload cancelled:", uploadErr);
            window.removeEventListener("offline", handleOffline);
            return; // Allow retry
          }

          console.error("Upload error:", uploadErr);
          postEditorStore$.submission.set((s) => ({
            ...s,
            status: "error",
            currentTask: "Upload failed",
            error: uploadErr?.message || "Upload error",
          }));
          toasts.destructive("Upload error", {
            id: toastId,
            description: "One or more files failed to upload. Try again.",
          });
          window.removeEventListener("offline", handleOffline);
          throw uploadErr; // bubble up to outer catch
        });

        // Mark newly uploaded files as uploaded (image might be undefined or array)
        if (image && Array.isArray(image)) {
          image.forEach((img: any) => {
            postEditorStore$.uploadedMediaNames.set((s) => {
              s.add(img.name);
              return s;
            });
          });

          imageInfo = image.map((img: any) => ({
            ufsUrl: img.ufsUrl,
            name: img.name,
          }));
        }
      }

      // Clean up offline listener
      window.removeEventListener("offline", handleOffline);

      media.forEach((m) => {
        if (
          m.file &&
          uploadedNames.has(m.file.name) &&
          !imageInfo.find((img) => img.name === m.file!.name)
        ) {
          // This file was uploaded in a previous attempt
          // We don't have its URL yet, so we'll get it from the media store if available
          if (m.remoteUrl) {
            imageInfo.push({ ufsUrl: m.remoteUrl, name: m.file.name });
          }
        }
      });
    }

    await new Promise((res) => setTimeout(res, 1500));
    postEditorStore$.submission.progress.set(90);
    postEditorStore$.submission.currentTask.set("Saving post...");
    toasts.loading(<ToastProgressBar progress={90} task="Saving post..." />, {
      id: toastId,
    });

    let hasFailedUploads = false;
    const postMedia = media
      .map((m) => {
        if (m.file) {
          // For file-based items, check if they were uploaded
          if (!uploadedNames.has(m.file.name)) {
            hasFailedUploads = true;
            return null; // This file wasn't uploaded, mark for retry
          }

          // File was uploaded, find its URL from imageInfo
          const uploaded = imageInfo.find((i) => i.name === m.file!.name);
          if (uploaded) {
            return {
              type: m.type,
              url: uploaded.ufsUrl,
              title: m.title,
              description: m.description,
              position: m.position,
            };
          } else if (m.remoteUrl) {
            // Use previously stored remoteUrl
            return {
              type: m.type,
              url: m.remoteUrl,
              title: m.title,
              description: m.description,
              position: m.position,
            };
          }

          return null;
        }

        // Non-file media (e.g., links) are included as-is. Use remoteUrl when present,
        // otherwise fall back to existing `url` (blob or remote).
        return {
          type: m.type,
          url: m.remoteUrl ?? m.url,
          title: m.title,
          description: m.description,
          position: m.position,
        };
      })
      .filter(
        (item): item is Exclude<typeof item, null> =>
          item !== null && Boolean(item?.url),
      );

    // If there are failed uploads, abort submission and let user retry
    if (hasFailedUploads) {
      const message = "Some media failed to upload. Please try again.";
      postEditorStore$.submission.set((s) => ({
        ...s,
        status: "error",
        error: message,
        currentTask: "Upload Failed - Ready to Retry",
      }));
      toasts.destructive("Upload Failed", {
        id: toastId,
        description: message,
      });
      return;
    }

    // Parse hashtags and mentions from content
    const hashtags = content ? extractHashtags(content) : [];
    const mentions = content ? extractMentions(content) : [];

    const postData = {
      content,
      media: postMedia as MediaPayloadItem[],
      visibilityId,
      visibilityRule: visibilityFilter,
      hashtags,
      mentions,
    };

    // Use the createPost function from usePostCreation hook
    // Enforce a conservative timeout on the API call to protect UI from hanging
    const TIMEOUT_MS = 30_000;
    const createPostPromise = createPost(postData);
    const timeoutPromise = new Promise<never>((_, rej) =>
      setTimeout(
        () => rej(new Error("Server timed out — try again later")),
        TIMEOUT_MS,
      ),
    );

    const result = await Promise.race([createPostPromise, timeoutPromise]);

    postEditorStore$.submission.set((s) => ({
      ...s,
      status: "completed",
      progress: 100,
      currentTask: "Your post is live!",
    }));
    toasts.success("Your post is live!", {
      id: toastId,
      description: "It has been successfully published.",
    });

    reset();
  } catch (e: any) {
    const errorMessage = e.message || "An unknown error occurred.";
    postEditorStore$.submission.set((s) => ({
      ...s,
      status: "error",
      error: errorMessage,
      currentTask: "Error - Ready to Retry",
    }));
    toasts.destructive("Submission Failed", {
      id: toastId,
      description: errorMessage,
    });
    // If network error, attach a 'retry when online' suggestion
    if (
      e instanceof Error &&
      (e.message.includes("network") || e.message.includes("timeout"))
    ) {
      if (typeof window !== "undefined") {
        window.addEventListener(
          "online",
          () => {
            toasts.info("Connection restored — retry posting your draft.");
          },
          { once: true },
        );
      }
    }
    // Don't reset on error; user should be able to retry
  }
}

function reset() {
  postEditorStore$.set(initialState);
  persistPostEditor.clearPersist();
}

export const postEditorActions = {
  openForCreate,
  close,
  clearDraft,
  addStagedMediaItem,
  removeStagedMedia,
  reorderStagedMedia,
  initiateSubmission,
  reset,
};
