"use client";

import { observer, useValue } from "@legendapp/state/react";
import { ImagePlus } from "lucide-react";

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
import { useSession } from "~/hooks/useAuth";
import {
  isSubmitting$,
  postEditorActions,
  postEditorStore$,
} from "~/stores/post-editor-store";
import VisibilitySelector from "./visibility-selector";

const PostEditorModal = observer(() => {
  const { user, isPending } = useSession();
  const isModalOpen = useValue(postEditorStore$.isModalOpen);
  const mode = useValue(postEditorStore$.mode);
  const content = useValue(postEditorStore$.content);
  const isPosting = useValue(isSubmitting$);

  if (!user) return null;

  return (
    <ResponsiveModal
      open={isModalOpen}
      onOpenChange={(open) => !open && postEditorActions.close()}
    >
      <ResponsiveModalContent className="p-0 pt-4 md:py-4">
        <ResponsiveModalHeader className="px-4 md:px-6">
          <ResponsiveModalTitle>
            {mode === "edit" ? "Edit Post" : "Create Post"}
          </ResponsiveModalTitle>
          <ResponsiveModalClose />
        </ResponsiveModalHeader>

        <Separator />

        {/* <ScrollArea className="max-h-[60dvh]"> */}
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <UserAvatar pending={isPending} user={user} size={10} />
            <div className="flex flex-col">
              <p className="font-semibold">{user.fullName}</p>
              <VisibilitySelector />
            </div>
          </div>

          <RichTextEditor
            value={content}
            onChange={(content) => postEditorStore$.content.set(content)}
            // getLinkPreview={(url) => checkForLinkPreview(url)}
            placeholder={`What's on your mind, ${user.fullName?.split(" ")[0]}?`}
            // className="min-h-[120px] resize-none border-none p-0 text-lg focus-visible:ring-0"
          />

          {/* Placeholder for Media Preview Grid */}
          <div className="text-muted-foreground flex min-h-24 items-center justify-center rounded-lg border border-dashed">
            Media Preview Area
          </div>
        </div>
        {/* </ScrollArea> */}

        <Separator />

        <ResponsiveModalFooter className="relative my-3 flex-row items-center justify-between px-4 md:px-6">
          <Button variant="outline" className="border-dashed">
            <ImagePlus className="mr-2 h-4 w-4" />
            Add Media
          </Button>
          <Button
            onClick={postEditorActions.initiateSubmission}
            disabled={isPosting}
          >
            {isPosting
              ? "Posting..."
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
