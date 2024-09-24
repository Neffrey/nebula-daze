"use client";

// LIBRARIES
import { useEffect, useState } from "react";

// UTILS

// COMPONENTS
import useWindowDimensions from "~/components/hooks/use-window-dimensions";

// PROPS
interface StickyScrollProps {
  elementHeight: number | undefined;
  enableBelowWidth?: number;
}

const useStickyScrollUp = ({
  elementHeight,
  enableBelowWidth,
}: StickyScrollProps) => {
  const [scroll, setScroll] = useState(0);
  const [oldScroll, setOldScroll] = useState(0);
  const [scrollDir, setScrollDir] = useState("");

  const { width } = useWindowDimensions();

  // Set Scroll
  useEffect(
    () => {
      const handleScroll = () => {
        const newScroll = Math.floor(window.scrollY);
        setTimeout(() => {
          setOldScroll(scroll);
          setScroll(newScroll);
          if (oldScroll < newScroll) setScrollDir("down");
          else setScrollDir("up");
        }, 100);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    },
    //   , []
  );

  // Bail if no elementHeight or scroll is above elementHeight
  if (!elementHeight || scroll < elementHeight) return "sticky top-0";

  // If no enableBelowWidth
  if (!enableBelowWidth || width < enableBelowWidth) {
    if (scrollDir === "down") {
      return "-top-[100%]";
    } else return "sticky top-0";
  }

  // Catch all
  return "sticky top-0";
};

export default useStickyScrollUp;
