"use client";

import type { User } from "better-auth";
import type { Variants } from "motion/react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Repeat2,
} from "lucide-react";
import { motion } from "motion/react";

import CreatePostMobile from "~/components/post/create/triggers/create-post-mobile";
import UserAvatar from "~/components/reuseables/UserAvatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { useSession } from "~/hooks/useAuth";

// --- ANIMATION FIX & REFINEMENT ---

// This container variant will be on the MainContent component itself.
// It ensures that its direct children (`Stories`, `PostCard`) animate in sequence.
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// This variant is for the children (`Stories`, `PostCard`)
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// --- NEW: Facebook-Style Story Card ---

interface StoryCardProps {
  user: Pick<User, "name" | "image">;
  storyImage: string;
  isAddStory?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({
  user,
  storyImage,
  isAddStory,
}) => {
  return (
    <div className="group relative h-52 w-32 shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-md">
      {storyImage ? (
        <Image
          src={storyImage}
          alt={`Story by ${user.fullName}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : null}
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

      {isAddStory ? (
        <div className="bg-card absolute inset-0 flex flex-col justify-end p-2 text-center">
          <div className="border-card bg-primary mx-auto grid h-10 w-10 place-items-center rounded-full border-4">
            <Plus className="text-primary-foreground h-6 w-6" />
          </div>
          <p className="mt-2 text-sm font-semibold">Create Story</p>
        </div>
      ) : (
        <>
          <div className="border-primary absolute top-2 left-2 rounded-full border-2 p-0.5">
            <UserAvatar user={user} pending={false} size={8} />
          </div>
          <p className="absolute bottom-2 left-2 text-sm font-semibold text-white">
            {user.fullName}
          </p>
        </>
      )}
    </div>
  );
};

const Stories = () => {
  const { user } = useSession();
  // Dummy data
  const stories = [
    {
      user: { name: "Shadcn", image: "https://github.com/shadcn.png" },
      storyImage: "/placeholder/story1.jpg",
    },
    {
      user: { name: "Vercel", image: "https://github.com/vercel.png" },
      storyImage: "/placeholder/story2.jpg",
    },
    {
      user: { name: "Vlad", image: "https://github.com/vlad.png" },
      storyImage: "/placeholder/story3.jpg",
    },
  ];

  return (
    // We wrap this component in motion.div so it can be animated by its parent
    <motion.div variants={itemVariants}>
      <div className="flex gap-3 overflow-x-auto pb-4 pl-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {user && (
          <StoryCard user={user} storyImage={user.image ?? ""} isAddStory />
        )}
        {stories.map((story) => (
          <StoryCard key={story.user.fullName} {...story} />
        ))}
      </div>
    </motion.div>
  );
};

const PostCard = () => (
  <motion.div variants={itemVariants}>
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar
          user={{ name: "Shadcn", image: "https://github.com/shadcn.png" }}
          pending={false}
        />
        <div className="flex-1">
          <p className="font-semibold">Shadcn</p>
          <p className="text-muted-foreground text-xs">@shadcn · 2h ago</p>
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

// --- THE MAIN COMPONENT ---
const MainContent = () => {
  return (
    // THE FIX: This component is now a motion component that orchestrates its children's animations.
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="col-span-full flex flex-col gap-4 md:col-span-4 lg:col-span-6"
    >
      <Stories />

      <div className="space-y-4 px-3 md:px-4">
        <CreatePostMobile />
        <PostCard />
        <PostCard />
      </div>
    </motion.div>
  );
};

export default MainContent;
