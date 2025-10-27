"use client";

import type { Variants } from "motion/react";
import Link from "next/link";
import { Bell, Bookmark, Home, Mail, User } from "lucide-react";
import { motion } from "motion/react";

import CreatePostDesktop from "~/components/post/create/triggers/create-post-desktop";
import UserAvatar from "~/components/reuseables/UserAvatar";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useSession } from "~/hooks/useAuth";

// Smoother spring animation for the sidebar entrance
const sidebarVariants: Variants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 80, damping: 20 },
  },
};

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Mail, label: "Messages", href: "/messages" },
  { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
  { icon: User, label: "Profile", href: "/profile" },
];

const LeftSidebar = () => {
  const { user, status } = useSession();
  const pending = status === "pending";

  return (
    <motion.aside
      variants={sidebarVariants}
      className="sticky hidden flex-col gap-4 md:col-span-2 md:flex lg:col-span-3"
    >
      {/* Unified Glassmorphism Card */}
      <Card className="mt-2 flex w-full flex-col gap-4 rounded-lg p-6 backdrop-blur-lg">
        {/* User Profile Section */}
        <CardTitle className="flex flex-row items-center justify-center gap-3 text-start">
          <UserAvatar
            user={user}
            pending={pending}
            className="scale-125"
            size={10}
          />
          <div className="flex w-full flex-col">
            {pending ? (
              <div className="bg-muted/50 mx-auto h-5 w-3/4 rounded-md" />
            ) : (
              <p className="font-bold">{user?.name}</p>
            )}
            {pending ? (
              <div className="bg-muted/50 mx-auto mt-2 h-4 w-1/2 rounded-md" />
            ) : (
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            )}
          </div>
        </CardTitle>

        <Separator />

        <CreatePostDesktop />

        {/* Navigation Section */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="justify-start gap-3 rounded-md px-3 py-6 text-base"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </Card>
    </motion.aside>
  );
};

export default LeftSidebar;
