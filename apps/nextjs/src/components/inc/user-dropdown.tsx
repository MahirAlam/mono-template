"use client";

import { IconExclamationCircle } from "@tabler/icons-react";
import { CreditCard, LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/hooks/useAuth";
import UserAvatar from "../reuseables/UserAvatar";

const UserDropdown = () => {
  const result = useSession();
  const user = result.user;
  const pending = result.status === "pending";

  if (result.status === "error") {
    return <IconExclamationCircle className="size-7" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={pending}>
        <button className="focus:ring-primary focus:ring-offset-background relative rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
          <UserAvatar
            user={user}
            size={9}
            pending={pending}
            className="hover:opacity-75"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-full min-w-64"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-row items-center justify-start gap-2">
            <UserAvatar pending={pending} user={user} size={9} />
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">{user?.name}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {user?.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
