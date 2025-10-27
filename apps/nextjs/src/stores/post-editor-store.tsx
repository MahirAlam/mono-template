import type { JSONContent } from "@tiptap/react";
import { batch, computed, observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { syncObservable } from "@legendapp/state/sync";
import { IconTrash } from "@tabler/icons-react";

import ToastProgressBar from "~/components/post/create/feedback/toast-progress-bar";
import { jsonToText } from "~/lib/editor-utils";
import { toasts } from "~/lib/toasts";

// --- Types ---
export type StagedMedia = {
  url: string; // Blob URL
  file: File;
  type: "image" | "video";
};
type SubmissionStatus = "idle" | "uploading" | "saving" | "completed" | "error";
type EditorMode = "create" | "edit";

// This interface defines the shape of our state for strict typing.
interface PostEditorState {
  mode: EditorMode;
  postId: string | null;
  isModalOpen: boolean;
  content: JSONContent | null;
  media: StagedMedia[];
  visibilityId: string;
  submission: {
    status: SubmissionStatus;
    progress: number;
    currentTask: string;
    error: string;
    toastId: string | number | null;
  };
}

// --- The Strictly Typed Initial State ---
const initialState: PostEditorState = {
  mode: "create",
  postId: null,
  isModalOpen: false,
  content: null,
  media: [],
  visibilityId: "c38b216c-e522-4a60-8422-96f7c5053b87", // Default to Public
  submission: {
    status: "idle",
    progress: 0,
    currentTask: "",
    error: "",
    toastId: null,
  },
};

export const postEditorStore$ = observable<PostEditorState>({
  ...initialState,
});

const persistPostEditor = syncObservable(postEditorStore$, {
  persist: {
    name: "postEditorDraft",
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
          <span className="bg-accent text-card-foreground rounded px-2 py-1 text-sm">
            Load Draft
          </span>
        ),
        onClick: () => postEditorStore$.isModalOpen.set(true),
      },
      duration: 100000,
      cancel: {
        label: <IconTrash className="size-5" />,
        onClick: () => {
          toasts.destructive("Are you sure?", {
            action: {
              label: (
                <span className="bg-destructive/20 text-card-foreground rounded px-2 py-1 text-sm">
                  Yes, Discard
                </span>
              ),
              onClick: () => clearDraft(true),
            },
            cancel: {
              label: "Cancel",
              onClick: () => postEditorStore$.isModalOpen.set(true),
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
  persistPostEditor.clearPersist();
  postEditorStore$.set(initialState);
  if (andOpen) {
    openForCreate();
  }
  toasts.success("Draft discarded.");
}

async function initiateSubmission() {
  const { mode, media } = postEditorStore$.get();
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

  try {
    await new Promise((res) => setTimeout(res, 1000));
    postEditorStore$.submission.progress.set(45);
    postEditorStore$.submission.currentTask.set(
      `Uploading ${media.length} media...`,
    );
    toasts.loading(
      <ToastProgressBar
        progress={45}
        task={`Uploading ${media.length} media...`}
      />,
      { id: toastId },
    );

    await new Promise((res) => setTimeout(res, 1500));
    postEditorStore$.submission.progress.set(90);
    postEditorStore$.submission.currentTask.set("Saving post...");
    toasts.loading(<ToastProgressBar progress={90} task="Saving post..." />, {
      id: toastId,
    });

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

    setTimeout(() => reset(), 200);
  } catch (e: any) {
    const errorMessage = e.message || "An unknown error occurred.";
    postEditorStore$.submission.set((s) => ({
      ...s,
      status: "error",
      error: errorMessage,
      currentTask: "Submission Failed",
    }));
    toasts.destructive("Submission Failed", {
      id: toastId,
      description: errorMessage,
    });
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
  initiateSubmission,
  reset,
};
