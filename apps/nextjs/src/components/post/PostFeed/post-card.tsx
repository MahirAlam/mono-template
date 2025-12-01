"use client";

import {
  IconMessageCircle,
  IconShare3,
  IconThumbUp,
} from "@tabler/icons-react";
import { MoreHorizontal } from "lucide-react";
import { motion, Variants } from "motion/react";

import { RankedPost } from "@tera/utils/types";

import UserAvatar from "~/components/reuseables/UserAvatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { jsonToText } from "~/lib/editor-utils";
import { getTimeAgo } from "~/lib/helpers";

// --- ANIMATION FIX & REFINEMENT ---

// This variant is for the children (`Stories`, `PostCard`)
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

interface PostCardProps {
  post: RankedPost;
}

const PostCard = ({ post }: PostCardProps) => {
  const postText = post.content ? jsonToText(post.content) : "";
  return (
    <motion.div variants={itemVariants}>
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <UserAvatar
            user={{
              name: post.author.name,
              image: post.author.image,
            }}
            pending={false}
          />
          <div className="flex-1">
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-muted-foreground text-xs">
              {getTimeAgo(new Date(post.createdAt))}
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </CardHeader>
        <CardContent className="px-2 pt-2">{postText}</CardContent>
        <CardFooter className="pt-2">
          <div className="flex w-full justify-start gap-4">
            <Button variant="ghost" size="icon">
              <IconThumbUp className="size-5" />
            </Button>
            <Button variant="ghost">
              <IconMessageCircle className="size-5" />
            </Button>
            <Button variant="ghost">
              <IconShare3 className="size-5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PostCard;
