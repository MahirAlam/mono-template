import { LucideIcon } from "lucide-react";

// Define a type for our visibility options for strong type safety
export type VisibilityOption = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  requiresFriends?: boolean;
  requiresFriendSelector?: boolean;
  requiresLists?: boolean;
};
