import type { JSONContent } from "@tiptap/react";
import { batch, computed, observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { syncObservable } from "@legendapp/state/sync";

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

export type ContentType = "post" | "comment" | "reply" | string;

type SubmissionStatus = "idle" | "uploading" | "saving" | "completed" | "error";

interface ContentEditorState<T extends ContentType = "post"> {
  type: T;
  content: JSONContent | null;
  media: StagedMediaItem[];
  submission: {
    status: SubmissionStatus;
    progress: number;
    currentTask: string;
    error: string;
    toastId: string | number | null;
  };
  uploadAbortController: AbortController | null;
}

const initialState: ContentEditorState = {
  type: "post",
  content: null,
  media: [],
  submission: {
    status: "idle",
    progress: 0,
    currentTask: "",
    error: "",
    toastId: null,
  },
  uploadAbortController: null,
};

export const contentEditorStore$ = observable<ContentEditorState>({
  ...initialState,
});

// Persist drafts (without media) in local storage
syncObservable(contentEditorStore$, {
  persist: {
    name: "contentEditorDraft",
    transform: {
      save: (value) => {
        const toSave = { ...value } as Partial<ContentEditorState>;
        toSave.media = [];
        return toSave;
      },
    },
    plugin: ObservablePersistLocalStorage,
  },
});

export const hasDraft$ = computed(() => {
  const content = contentEditorStore$.content.get();
  const media = contentEditorStore$.media.get();
  const hasText = content ? Boolean(content) : false;
  return hasText || media.length > 0;
});

export function resetContentEditor() {
  contentEditorStore$.set(initialState);
}

export const contentEditorActions = {
  reset: resetContentEditor,
};

export type SubmissionCallbacks = {
  setProgress: (progress: number, task?: string) => void;
  setError: (errorMessage: string) => void;
  setCompleted: () => void;
  getAbortSignal: () => AbortSignal | undefined;
};

/**
 * Initiate a submission with an orchestrator function.
 * The onSubmit function receives the current content/editor state and the callbacks
 * it can use to report progress/errors/completion.
 */
export async function initiateSubmission(
  onSubmit: (
    data: { content: JSONContent | null; media: StagedMediaItem[]; type: ContentType },
    callbacks: SubmissionCallbacks,
  ) => Promise<void>,
) {
  const abortController = new AbortController();
  contentEditorStore$.uploadAbortController.set(abortController);

  // Set initial submission state
  contentEditorStore$.submission.set((s) => ({
    ...s,
    status: "uploading",
    progress: 0,
    currentTask: "Preparing submission...",
    error: "",
  }));

  const callbacks: SubmissionCallbacks = {
    setProgress: (progress: number, task = "") => {
      contentEditorStore$.submission.set((s) => ({
        ...s,
        progress,
        currentTask: task || s.currentTask,
      }));
    },
    setError: (errorMessage: string) => {
      contentEditorStore$.submission.set((s) => ({
        ...s,
        status: "error",
        error: errorMessage,
      }));
    },
    setCompleted: () => {
      contentEditorStore$.submission.set((s) => ({
        ...s,
        status: "completed",
        progress: 100,
        currentTask: "Completed",
      }));
    },
    getAbortSignal: () => abortController.signal,
  };

  const data = {
    content: contentEditorStore$.content.get(),
    media: contentEditorStore$.media.get(),
    type: contentEditorStore$.type.get(),
  };

  try {
    await onSubmit(data, callbacks);
  } catch (e: any) {
    const message = e?.message || String(e) || "Unknown error";
    callbacks.setError(message);
  } finally {
    // Clear abort controller reference
    contentEditorStore$.uploadAbortController.set(null);
  }
}
