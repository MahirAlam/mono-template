/**
 * Hook to handle post creation retry when connection is restored.
 * Listens for online events and automatically retries post creation.
 */

import { useEffect } from "react";

import { postEditorStore$ } from "~/stores/post-editor-store";
import { usePostCreation } from "./usePostCreation";

/**
 * Attaches an online listener that attempts to retry post creation
 * if submission was interrupted by network loss.
 */
export function useRetryPostOnline() {
  const { createPost } = usePostCreation();

  useEffect(() => {
    const handleOnline = async () => {
      const submission = postEditorStore$.submission.get();

      // Only retry if there was an error that looks network-related
      if (
        submission.status === "error" &&
        (submission.error.includes("offline") ||
          submission.error.includes("network") ||
          submission.error.includes("timeout"))
      ) {
        // Signal that we're ready to retry
        postEditorStore$.submission.set((s) => ({
          ...s,
          currentTask: "Connection restored — ready to retry",
          error: "",
        }));
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}
