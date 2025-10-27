import type { IconProps } from "@tabler/icons-react";
import type { LucideIcon } from "lucide-react";

export interface BasicInfo {
  title: string;
  description: string;
}

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType<IconProps> | LucideIcon;
}

export type NavigationItems = NavigationItem[];
