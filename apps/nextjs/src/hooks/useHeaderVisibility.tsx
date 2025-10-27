import { useEffect, useRef, useState } from "react";

/**
 * A hook to track header visibility based on scroll direction.
 * The header hides on scroll down and shows on scroll up.
 *
 * @param {number} threshold - The scroll distance before the logic activates. Defaults to the standard header height.
 * @returns {boolean} `isHidden` - True if the header should be hidden.
 */
export const useHeaderVisibility = (threshold = 64): boolean => {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show the header when scrolled to the top
      if (currentScrollY < threshold) {
        setIsHidden(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        setIsHidden(true); // Scrolling down
      } else {
        setIsHidden(false); // Scrolling up
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return isHidden;
};

export default useHeaderVisibility;
