"use client";

import { forbidden, useRouter } from "next/navigation";
import { IconExclamationCircle, IconMoon, IconSun } from "@tabler/icons-react";
import { CreditCard, LogOut, Settings, User } from "lucide-react";
import { useTheme } from "next-themes";

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
import { authClient } from "~/lib/auth/client";
import { toasts } from "~/lib/toasts";
import UserAvatar from "../reuseables/UserAvatar";

const UserDropdown = () => {
  const result = useSession();
  const user = result.user;
  const pending = result.status === "pending";
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  if (result.status === "error") {
    return <IconExclamationCircle className="size-7" />;
  }

  const handleLogOut = async () => {
    if (!user) {
      forbidden();
    }

    if (pending) {
      return;
    }

    const res = await authClient.signOut();

    if (res.data?.success) {
      router.refresh();
    }

    if (res.error) {
      toasts.destructive(res.error.message);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={pending}>
        <button className="focus:ring-primary focus:ring-offset-background relative rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
          <UserAvatar
            user={user}
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
          <DropdownMenuItem
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? (
              <IconSun className="mr-2 h-4 w-4" />
            ) : (
              <IconMoon className="mr-2 h-4 w-4" />
            )}
            <span>
              {theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
