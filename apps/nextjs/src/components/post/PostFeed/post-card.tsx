"use client";

import { Heart, MessageCircle, MoreHorizontal, Repeat2 } from "lucide-react";
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

const PostCard = ({ post }: PostCardProps) => (
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
      <CardContent>
        <p className="leading-relaxed">
          Just launched a new set of components for shadcn/ui! Hope you all
          enjoy the new calendar and date picker. ✨
        </p>
        <div className="bg-muted mt-4 aspect-video rounded-lg border" />
      </CardContent>
      <CardFooter className="border-t px-2 pt-2">
        <div className="flex w-full justify-around">
          <Button variant="ghost" className="gap-2">
            <Heart className="h-5 w-5" /> Like
          </Button>
          <Button variant="ghost" className="gap-2">
            <MessageCircle className="h-5 w-5" /> Comment
          </Button>
          <Button variant="ghost" className="gap-2">
            <Repeat2 className="h-5 w-5" /> Repost
          </Button>
        </div>
      </CardFooter>
    </Card>
  </motion.div>
);

export default PostCard;
