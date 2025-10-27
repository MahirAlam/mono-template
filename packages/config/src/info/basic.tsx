import { IconHomeFilled } from "@tabler/icons-react";
import { Clapperboard, Users } from "lucide-react";

import type { BasicInfo, NavigationItems } from "../types/basic";

export const basic: BasicInfo = {
  title: "teraTok",
  description: "the future of social media.",
};

export const navigationItems: NavigationItems = [
  {
    title: "Home",
    icon: IconHomeFilled,
    href: "/",
  },
  {
    title: "Friends",
    icon: Users,
    href: "/friends",
  },
  {
    title: "Reels",
    icon: Clapperboard,
    href: "/reels",
  },
];
