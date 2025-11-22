"use client";

import React, { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { contentEditorStore$, initiateSubmission } from "~/stores/content-editor-store";
import { batch } from "@legendapp/state";

type ContentEditorProps = {
  contentType?: string;
  initialContent?: any;
  placeholder?: string;
  onCancelAction?: () => void;
  onSuccessAction?: (data: any) => void;
  onSubmitAction: (
    data: { content: any; media: any[]; visibilityId?: string },
    callbacks: import("~/stores/content-editor-store").SubmissionCallbacks,
  ) => Promise<any>;
  renderAttachmentPreview?: (item: any) => React.ReactNode;
  maxMedia?: number;
};

export default function ContentEditor({
  contentType = "post",
  initialContent,
  placeholder = "What's happening?",
  onCancelAction,
  onSuccessAction,
  renderAttachmentPreview,
  maxMedia = 4,
  onSubmit,
}: ContentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: initialContent ?? null,
  });

  const isCreating = contentEditorStore$.submission.status.get() === "uploading";

  const [localState, setLocal] = useState({ media: [] as any[] });

  async function handleSubmit() {
    // Sync editor content and local media into the content store
    const content = editor?.getJSON() || null;
    contentEditorStore$.content.set(content);
    contentEditorStore$.media.set(localState.media);

    // The caller provides the orchestration; we just provide the tools
    await initiateSubmission(async (data, callbacks) => {
      // Call the provided orchestrator with the submission callbacks
      try {
        const result = await onSubmitAction(data, callbacks);
        // Notify success to parent hook
        onSuccessAction?.(result);
      } catch (e: any) {
        callbacks.setError(e?.message || "Failed to submit");
        throw e;
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-3">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {/* attachment previews */}
          {localState.media.map((m) => (
            <div key={m.url}>{renderAttachmentPreview?.(m)}</div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => onCancelAction?.()}
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => void handleSubmit()}
            disabled={isCreating}
          >
            {isCreating ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
