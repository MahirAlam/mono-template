"use client";

import { AnimatePresence } from "motion/react";

import LeftSidebar from "~/components/layout/home/left-sidebar";
import MainContent from "~/components/layout/home/main-content";
import RightSidebar from "~/components/layout/home/right-sidebar";
import useHeaderVisibility from "~/hooks/useHeaderVisibility";

export default function HomePage() {
  const isHidden = useHeaderVisibility();

  return (
    <AnimatePresence>
      <div className="grid grid-cols-12 px-4 pt-4 md:px-2 xl:px-4">
        {/* Left Sidebar */}
        <aside
          className={`sticky col-span-5 hidden transition-all duration-300 ease-in-out md:block lg:col-span-3 ${
            isHidden ? "top-4" : "top-20"
          } h-fit`}
        >
          <LeftSidebar />
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-7 lg:col-span-6">
          <MainContent />
        </main>

        {/* Right Sidebar */}
        <aside
          className={`sticky col-span-5 hidden transition-all duration-300 ease-in-out md:block lg:col-span-3 ${
            isHidden ? "top-4" : "top-20"
          } h-fit`}
        >
          <RightSidebar />
        </aside>
      </div>
    </AnimatePresence>
  );
}
