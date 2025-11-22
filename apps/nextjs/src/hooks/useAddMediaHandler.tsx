import { useCallback, useEffect } from "react";
import { useValue } from "@legendapp/state/react";
import { FileRejection, useDropzone } from "react-dropzone";

import { MAX_MEDIA_ITEMS } from "@tera/config";

import { toasts } from "~/lib/toasts";
import {
  postEditorActions,
  postEditorStore$,
} from "~/stores/post-editor-store";

const useAddMediaHandler = () => {
  const media = useValue(postEditorStore$.media);
  const isModalOpen = useValue(postEditorStore$.isModalOpen);
  const { addStagedMediaItem } = postEditorActions;

  const handleFileRejection = (rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (!rejection) return;

    const { file, errors } = rejection;
    const error = errors[0];
    if (!error) return;

    if (error.code === "file-too-large") {
      toasts.destructive(`${file.name} is too large.`, {
        description: "Please select a smaller file.",
      });
    } else if (error.code === "file-invalid-type") {
      toasts.destructive(`${file.name} is not a supported file type.`, {
        description: "Please select an image or video.",
      });
    } else {
      toasts.destructive(`An error occurred with ${file.name}.`, {
        description: error.message,
      });
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const remainingSlots = MAX_MEDIA_ITEMS - media.length;
      if (remainingSlots <= 0) {
        toasts.destructive(`Maximum ${MAX_MEDIA_ITEMS} files allowed`);
        return;
      }

      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      if (filesToAdd.length < acceptedFiles.length) {
        toasts.warning(
          `Only ${filesToAdd.length} files added. Maximum ${MAX_MEDIA_ITEMS} files allowed.`,
        );
      }

      try {
        await addStagedMediaItem(filesToAdd);
        toasts.success(`${filesToAdd.length} file(s) added successfully!`);
      } catch (error) {
        console.error("Failed to add media:", error);
        toasts.destructive("Failed to add media files");
      }
    },
    [media.length, addStagedMediaItem],
  );

  const { getRootProps, open, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      onDropRejected: handleFileRejection,
      noClick: true,
      noKeyboard: true,
      accept: { "image/*": [], "video/*": [] },
    });

  // Handle Clipboard Paste
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!isModalOpen || !event.clipboardData) return;
      const files = Array.from(event.clipboardData.files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length > 0) {
        event.preventDefault();
        onDrop(files);
      }
    };
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isModalOpen, onDrop]);

  return {
    getRootProps,
    open,
    media,
    getInputProps,
    isDragActive,
    isDragReject,
  };
};

export default useAddMediaHandler;
