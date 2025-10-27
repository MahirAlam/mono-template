"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

import { basicInfo } from "@tera/config";

import { cn } from "~/lib/utils";

const MobileNav = ({ isHidden }: { isHidden: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();

  // State to hold the position and width of the active link's underline
  const [activeLinkBounds, setActiveLinkBounds] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // A ref to hold an array of the link DOM elements
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [isReloading, setIsReloading] = useState(false);

  // This effect runs when the pathname changes to measure the new active link
  useEffect(() => {
    const activeLinkIndex = basicInfo.navigationItems.findIndex(
      (item) => item.href === pathname,
    );
    const activeLinkElement = linkRefs.current[activeLinkIndex];

    if (activeLinkElement) {
      setActiveLinkBounds({
        left: activeLinkElement.offsetLeft,
        width: activeLinkElement.offsetWidth,
      });
    }
  }, [pathname]);

  return (
    // If reloading, we override the normal content with a simple overlay
    // or just show the normal nav but prevent interaction.
    <motion.nav
      initial={{ y: "0%" }}
      animate={{ y: isHidden ? "100%" : "0%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      // The nav container must be relative for the absolute underline
      className="bg-background/80 shadow-md-t fixed right-2 bottom-0 left-2 z-40 flex h-16 items-center justify-around border-t backdrop-blur-sm md:hidden"
    >
      {/* ⚡ NEW: Conditional Rendering for the Reloading Indicator */}
      {isReloading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2
            className="text-primary h-8 w-8 animate-spin"
            aria-label="Reloading page"
          />
        </div>
      ) : (
        // Render the normal navigation when not reloading
        <>
          {/* The single, animated underline element */}
          {activeLinkBounds && (
            <motion.span
              animate={{
                ...activeLinkBounds,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
              }}
              className="bg-primary absolute bottom-0 h-1 rounded-full"
            />
          )}

          {basicInfo.navigationItems.map((link, index) => {
            const isActive = pathname === link.href;

            const handleLinkClick = (
              e: React.MouseEvent<HTMLAnchorElement>,
            ) => {
              if (isActive) {
                e.preventDefault();

                // 1. Scroll to the top of the page smoothly
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });

                // 2. Show the reloading indicator
                setIsReloading(true);

                // 3. Delay and refresh the page (0.1s delay)
                setTimeout(() => {
                  router.refresh();
                  setIsReloading(false);
                }, 200); // 100 milliseconds
              }
            };

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick} // Apply the custom handler
                // Store a ref to each link element in our array
                ref={(el) => {
                  linkRefs.current[index] = el;
                }}
                data-active={isActive}
                className={cn(
                  // Increase padding for a better touch target and visual balance
                  "flex h-full w-full flex-col items-center justify-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* If the icon is active, we render it filled */}
                <link.icon
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Link>
            );
          })}
        </>
      )}
    </motion.nav>
  );
};

export default MobileNav;
