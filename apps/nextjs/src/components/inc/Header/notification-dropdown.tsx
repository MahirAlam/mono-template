"use client";

import { Bell } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const NotificationDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Bell className="h-7 w-7" />
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-full min-w-72"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* In a real app, you would map over notifications here */}
        <DropdownMenuItem className="flex flex-col items-start gap-1">
          <p className="text-sm font-medium">New Follower</p>
          <p className="text-muted-foreground text-xs">
            @shadcn started following you.
          </p>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex flex-col items-start gap-1">
          <p className="text-sm font-medium">Post Liked</p>
          <p className="text-muted-foreground text-xs">
            @vlad liked your recent post.
          </p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
