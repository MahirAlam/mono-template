"use client";

import type { Variants } from "motion/react";
import { motion } from "motion/react";

import LeftSidebar from "~/components/layout/home/left-sidebar";
import MainContent from "~/components/layout/home/main-content";
import RightSidebar from "~/components/layout/home/right-sidebar";

// Stagger the children components for a flowing animation
const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // A slightly slower stagger for a more elegant feel
    },
  },
};

export default function HomePage() {
  return (
    <motion.main
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 items-start gap-4 pt-4 md:grid-cols-6 md:px-6 md:pt-6 lg:grid-cols-12 lg:gap-8"
    >
      <LeftSidebar />
      <MainContent />
      <RightSidebar />
    </motion.main>
  );
}
