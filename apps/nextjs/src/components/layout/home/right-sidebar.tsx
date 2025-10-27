"use client";

import type { Variants } from "motion/react";
import { motion } from "motion/react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

// Smoother spring animation for the sidebar entrance
const sidebarVariants: Variants = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 80, damping: 20 },
  },
};

interface SuggestedFriendProps {
  name: string;
  handle: string;
  imageSrc: string;
}

const SuggestedFriend: React.FC<SuggestedFriendProps> = ({
  name,
  handle,
  imageSrc,
}) => (
  <div className="hover:bg-accent/50 items-center gap-3 rounded-md p-2 transition-colors">
    <Avatar>
      <AvatarImage src={imageSrc} />
      <AvatarFallback>{name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground text-sm">{handle}</p>
    </div>
    <Button variant="secondary" size="sm">
      Follow
    </Button>
  </div>
);

interface TrendingTopicProps {
  topic: string;
  count: string;
}

const TrendingTopic: React.FC<TrendingTopicProps> = ({ topic, count }) => (
  <div className="hover:bg-accent/50 rounded-md p-2 transition-colors">
    <p className="font-semibold">{topic}</p>
    <p className="text-muted-foreground text-sm">{count} posts</p>
  </div>
);

const RightSidebar = () => {
  return (
    <motion.aside
      variants={sidebarVariants}
      className="sticky hidden flex-col gap-4 lg:col-span-3 lg:flex"
    >
      <div className="flex w-full flex-col gap-6">
        {/* Glassmorphism Cards */}
        <Card className="bg-card/50 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>Who to follow</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <SuggestedFriend
              name="Vercel"
              handle="@vercel"
              imageSrc="https://github.com/vercel.png"
            />
            <SuggestedFriend
              name="Vlad"
              handle="@vlad"
              imageSrc="https://github.com/vlad.png"
            />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>Trending</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <TrendingTopic topic="#NextJS15" count="21.3k" />
            <TrendingTopic topic="#React19" count="15.1k" />
            <TrendingTopic topic="#Shadcn" count="11.8k" />
          </CardContent>
        </Card>
      </div>
    </motion.aside>
  );
};

export default RightSidebar;
