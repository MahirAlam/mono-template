"use client";

import { observer, useValue } from "@legendapp/state/react";
import { ImagePlus } from "lucide-react";

import { MAX_MEDIA_ITEMS } from "@tera/config";

import UserAvatar from "~/components/reuseables/UserAvatar";
import { Button } from "~/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalClose,
  ResponsiveModalContent,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "~/components/ui/responsive-modal";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { Separator } from "~/components/ui/separator";
import useAddMediaHandler from "~/hooks/useAddMediaHandler";
import { useSession } from "~/hooks/useAuth";
import { usePostCreation } from "~/hooks/usePostCreation";
import {
  isSubmitting$,
  postEditorActions,
  postEditorStore$,
} from "~/stores/post-editor-store";
import { MediaGrid } from "../../media-grid";
import MediaDrag from "./media-drag";
import VisibilitySelector from "./visibility-selector";

const PostEditorModal = observer(() => {
  const { user, isPending } = useSession();
  const isModalOpen = useValue(postEditorStore$.isModalOpen);
  const mode = useValue(postEditorStore$.mode);
  const content = useValue(postEditorStore$.content);
  const isPosting = useValue(isSubmitting$);
  const submissionStatus = useValue(postEditorStore$.submission.status);
  const { createPost } = usePostCreation();

  const { close, initiateSubmission, removeStagedMedia, reorderStagedMedia } =
    postEditorActions;

  const {
    getRootProps,
    open,
    getInputProps,
    media,
    isDragActive,
    isDragReject,
  } = useAddMediaHandler();

  if (!user) return null;

  const isError = submissionStatus === "error";

  return (
    <ResponsiveModal
      open={isModalOpen}
      onOpenChange={(open) => !open && close()}
    >
      <ResponsiveModalContent className="p-0 pt-4 md:py-4" {...getRootProps()}>
        <ResponsiveModalHeader className="px-4 md:px-6">
          <ResponsiveModalTitle>
            {mode === "edit" ? "Edit Post" : "Create Post"}
          </ResponsiveModalTitle>
          <ResponsiveModalClose />
        </ResponsiveModalHeader>

        <Separator className="bg-accent/50 h-px shadow" />

        <MediaDrag
          isDragActive={isDragActive}
          isDragReject={isDragReject}
          media={media}
        />

        <div className="space-y-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <UserAvatar pending={isPending} user={user} size={10} />
            <div className="flex flex-col">
              <p className="font-semibold">{user.name}</p>
              <VisibilitySelector />
            </div>
          </div>

          <RichTextEditor
            value={content}
            onChange={(content) => postEditorStore$.content.set(content)}
            // getLinkPreview={(url) => checkForLinkPreview(url)}
            placeholder={`What's on your mind, ${user.name.split(" ")[0]}?`}
            editorClassName="min-h-[120px] text-lg"
          />

          {/* Media Grid */}
          <MediaGrid
            items={media}
            onRemove={removeStagedMedia}
            onReorderAction={reorderStagedMedia}
            enableReordering={true}
          />
        </div>

        <input {...getInputProps()} className="hidden opacity-0" type="file" />

        <Separator className="bg-accent/50 h-px shadow" />

        <ResponsiveModalFooter className="my-3 w-full flex-row items-center! justify-between! px-4 md:px-6">
          <Button
            disabled={media.length >= MAX_MEDIA_ITEMS || isPosting}
            onClick={() => open()}
            variant="ghost"
            size="icon"
            className="border-dashed p-1"
          >
            <ImagePlus className="size-6!" />
          </Button>
          <Button
            onClick={() => initiateSubmission({ createPost })}
            disabled={isPosting && !isError}
          >
            {isPosting && !isError
              ? "Posting..."
              : isError
                ? "Post Again"
                : mode === "edit"
                  ? "Save Changes"
                  : "Post"}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
});

export default PostEditorModal;
