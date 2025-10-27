"use client";

import { PlusSquare } from "lucide-react";

import { Button } from "~/components/ui/button";
import { postEditorActions } from "~/stores/post-editor-store";

const CreatePostDesktop = () => {
  return (
    <Button
      size="lg"
      effect="gooeyLeft"
      className="w-full py-6 text-base"
      onClick={postEditorActions.openForCreate}
    >
      <PlusSquare className="mr-2 h-5 w-5" /> Create Post
    </Button>
  );
};

export default CreatePostDesktop;
