"use client";

import UserAvatar from "~/components/reuseables/UserAvatar";
import { Card } from "~/components/ui/card";
import { useSession } from "~/hooks/useAuth";
import { postEditorActions } from "~/stores/post-editor-store";

const CreatePostMobile = () => {
  const { user, status } = useSession();

  return (
    <div className="md:hidden">
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} pending={status === "pending"} />
          <button
            onClick={postEditorActions.openForCreate}
            className="bg-muted/50 text-muted-foreground hover:bg-muted/80 h-10 flex-1 cursor-pointer rounded-full px-4 text-left text-sm transition-colors md:text-base"
          >
            What's on your mind, {user?.name?.split(" ")[0] ?? "User"}?
          </button>
        </div>
      </Card>
    </div>
  );
};

export default CreatePostMobile;
