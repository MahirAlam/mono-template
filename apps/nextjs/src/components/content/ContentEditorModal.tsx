"use client";

import { Dialog, DialogContent } from "../ui/dialog";
import ContentEditor from "./ContentEditor";

export default function ContentEditorModal({
  open,
  onOpenChange,
  onSuccess,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: (data: any) => void;
  onSubmit: (
    data: any,
    callbacks: import("~/stores/content-editor-store").SubmissionCallbacks,
  ) => Promise<any>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card w-full max-w-xl rounded-lg p-4">
        <ContentEditor
          onCancel={() => onOpenChange(false)}
          onSuccess={(d) => {
            onSuccess?.(d);
            onOpenChange(false);
          }}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
