import type { User } from "better-auth";
import type { Variants } from "motion/react";
import { Plus } from "lucide-react";
import { motion } from "motion/react";

import CreatePostMobile from "~/components/post/create/triggers/create-post-mobile";
import PostFeed from "~/components/post/PostFeed";
import UserAvatar from "~/components/reuseables/UserAvatar";
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
    <div className="group cursor-pointerf relative h-52 w-32 shrink-0 rounded-xl shadow-md">
      {/* {storyImage ? (
        <Image
          src={storyImage}
          alt={`Story by ${user.name}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : null} */}
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
            {user.name}
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
      user: {
        name: "Shadcn",
        image:
          "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
      },
      storyImage: "/placeholder/story1.jpg",
    },
    {
      user: {
        name: "Vercel",
        image:
          "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
      },
      storyImage: "/placeholder/story2.jpg",
    },
    {
      user: {
        name: "Vlad",
        image:
          "https://oq3ywfdlbc.ufs.sh/f/xozEwwq03BlZ4pWy8I1UzkjfshnbEXtMJq2u40c16oYIxvZK",
      },
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
          <StoryCard key={story.user.name} {...story} />
        ))}
      </div>
    </motion.div>
  );
};

// --- THE MAIN COMPONENT ---
const MainContent = () => {
  return (
    <div className="col-span-full flex flex-col gap-4 md:col-span-4 lg:col-span-6">
      <Stories />

      <div className="w-full space-y-4 px-3 md:px-4">
        <CreatePostMobile />
        <PostFeed feedFor="home" />
      </div>
    </div>
  );
};

export default MainContent;
