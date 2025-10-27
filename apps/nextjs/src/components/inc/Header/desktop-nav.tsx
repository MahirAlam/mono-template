"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { basicInfo } from "@tera/config";

import { cn } from "~/lib/utils";

const DesktopNav = () => {
  const pathname = usePathname();

  return (
    // The nav container now fills the header's height to correctly position the underline
    <nav className="hidden h-full space-x-2 md:flex">
      {basicInfo.navigationItems.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            data-active={isActive}
            className={cn(
              // We make the link fill the height and act as the relative parent
              "relative flex h-full items-center rounded-lg px-6 text-sm font-medium transition-colors hover:opacity-70",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <link.icon className="h-6 w-6" />

            {isActive && (
              <motion.span
                layoutId="desktop-nav-underline"
                className="bg-primary absolute bottom-0 left-0 h-1 w-full rounded-full"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
