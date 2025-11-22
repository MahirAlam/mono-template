import type { LucideIcon } from "lucide-react";

// Define a type for our visibility options for strong type safety
export interface VisibilityOption {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  requiresFriendSelector?: boolean;
  // Filter string stored in DB (e.g. 'public', 'friends', 'specific-friends')
  // `filter` can be either a simple string (e.g. "public", "friends")
  // or an array of ids to represent user-selected lists/people.
  filter?: string | string[];
}

// Define a type for our reaction options for strong type safety
export type QuickReaction = {
  id: string; // Pre-generated, stable UUIDs
  name: "Love" | "Like" | "Celebrate" | "Funny" | "Sad" | "Angry";
  displayCode: string; // The emoji character
};
