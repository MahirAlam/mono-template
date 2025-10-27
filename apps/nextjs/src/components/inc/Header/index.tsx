"use client";

import Link from "next/link";
import { motion } from "motion/react";

import AppLogo from "~/components/Logo";
import useHeaderVisibility from "~/hooks/useHeaderVisibility";
import UserDropdown from "../user-dropdown";
import DesktopNav from "./desktop-nav";
import MobileNav from "./mobile-nav";
import NotificationDropdown from "./notification-dropdown";

const Header = () => {
  const isHidden = useHeaderVisibility();

  return (
    <>
      <motion.header
        animate={{ y: isHidden ? "-100%" : "0%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-background/80 sticky top-0 z-50 w-full border-b shadow-md backdrop-blur-sm"
      >
        <div className="container flex h-16">
          {/* Left Side: Logo */}
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <AppLogo className="h-8 w-auto" />
            </Link>
          </div>

          {/* Middle: Desktop Navigation */}
          <div className="flex flex-1 items-center justify-center">
            <DesktopNav />
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center justify-end space-x-2">
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>
      </motion.header>

      {/* We pass the `isHidden` state down to the MobileNav as a prop */}
      <MobileNav isHidden={isHidden} />
    </>
  );
};

export default Header;
