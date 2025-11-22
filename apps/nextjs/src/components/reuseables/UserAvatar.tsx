import type { AvatarProps } from "@radix-ui/react-avatar";
import type { User } from "better-auth";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
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
    return null;
  }

  return (
    <Avatar
      className={cn(
        `w-${size} h-${size} avatar-hover rounded-full`,
        props.className,
      )}
      {...props}
    >
      {user.image ? <Image fill src={user.image} alt={user.name} /> : null}
      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
