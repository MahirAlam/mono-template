import Link from "next/link";
import { Bell, Bookmark, Home, Mail, User } from "lucide-react";

import CreatePostDesktop from "~/components/post/create/triggers/create-post-desktop";
import UserAvatar from "~/components/reuseables/UserAvatar";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useSession } from "~/hooks/useAuth";

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
    <>
      {/* Unified Glassmorphism Card */}
      <Card className="flex w-full flex-col gap-4 rounded-lg px-4 py-6 backdrop-blur-lg">
        {/* User Profile Section */}
        <CardTitle className="inline-flex w-fit flex-row items-center justify-start gap-3 p-0">
          <UserAvatar
            user={user}
            pending={pending}
            loadingClass="!w-10 scale-115 !h-8"
            className="scale-115"
          />
          <div className="flex w-full flex-col">
            {pending ? (
              <div className="bg-muted/50 mx-auto h-5 w-3/4 rounded-lg" />
            ) : (
              <p className="font-bold">{user?.name}</p>
            )}
            {pending ? (
              <div className="bg-muted/50 mx-auto mt-2 h-4 w-1/2 rounded-lg" />
            ) : (
              <p className="text-muted-foreground text-sm">
                {user?.email.split("@")[0]}...
              </p>
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
              className="justify-start gap-3 rounded-lg px-3 py-6 text-base"
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
    </>
  );
};

export default LeftSidebar;
