import {
  Globe,
  Lock,
  Star,
  UserCheck,
  Users,
  Users2,
  UserX,
} from "lucide-react";

import { basicInfo } from "../index";
import { VisibilityOption } from "../types/post";

// This is the single source of truth for all post visibility settings.
export const POST_VISIBILITY_CONFIG: VisibilityOption[] = [
  {
    id: "c38b216c-e522-4a60-8422-96f7c5053b87",
    name: "Public",
    description: `Visible to anyone on or off ${basicInfo.basic.title}`,
    icon: Globe,
  },
  {
    id: "87a74cb1-f5e1-4b1e-8419-722c1d1a6a84",
    name: "Friends",
    description: `Visible to your friends on ${basicInfo.basic.title}`,
    icon: Users,
    requiresFriends: true,
  },
  {
    id: "a43d9178-ed82-4412-9175-23a54b38a798",
    name: "Friends of Friends",
    description: "Visible to your friends, and their friends",
    icon: Users2,
    requiresFriends: true,
  },
  {
    id: "f8220a2b-8a8b-4b43-8512-3f24d2a6a422",
    name: "Only Me",
    description: "Visible only to you",
    icon: Lock,
  },
  {
    id: "1f9d6c3a-8b1e-4f3e-9e7b-9f6e1a3b2c5d",
    name: "Friends Except...",
    description: "Visible to your friends, except specific people",
    icon: UserX,
    requiresFriendSelector: true,
  },
  {
    id: "5e2b8f7c-1d9a-4c8e-9b3a-8f6a9c1d3e5f",
    name: "Specific Friends",
    description: "Only show to some of your friends",
    icon: UserCheck,
    requiresFriendSelector: true,
  },
  {
    id: "d9c8b7a6-3e5f-4d1a-9b8c-7a6b5c4d3e2f",
    name: "Close Friends",
    description: "Your custom 'Close Friends' list",
    icon: Star,
    requiresLists: true,
  },
];
