import type { AvatarProps } from "@radix-ui/react-avatar";
import type { User } from "better-auth";
import { useRouter } from "next/navigation";

import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";

interface Props extends AvatarProps {
  user: Pick<User, "name" | "image"> | null | undefined;
  pending: boolean;
  size?: number;
  loadingClass?: string;
}

const UserAvatar = ({
  user,
  pending,
  size = 9,
  loadingClass = "",
  ...props
}: Props) => {
  const router = useRouter();

  if (pending) {
    return (
      <Skeleton
        className={cn(
          `w-${size} h-${size} bg-accent rounded-full`,
          loadingClass,
        )}
      />
    );
  }

  if (!user) {
    router.replace("/auth/sign-in");

    return null;
  }

  return (
    <Avatar
      className={cn(`w-${size} h-${size} rounded-full`, props.className)}
      {...props}
    >
      {user.image ? <AvatarImage src={user.image} alt={user.fullName} /> : null}
      <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
