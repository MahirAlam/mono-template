"use client";

import type { Variants } from "motion/react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

// Centralized animation variants for all auth pages
const pageTransitionVariants: Variants = {
  // The page starts slightly down and faded out
  initial: { opacity: 0, y: 20 },
  // Animates to its final position, fully visible
  animate: { opacity: 1, y: 0 },
  // Fades and moves up slightly when exiting
  exit: { opacity: 0, y: -20 },
};

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-md"
      transition={{ type: "spring", stiffness: 150, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
