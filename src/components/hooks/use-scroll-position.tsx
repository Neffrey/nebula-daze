"use client";

// LIBS
import { useLayoutEffect, useState } from "react";

// UTILS
import useWindowDimensions from "~/components/hooks/use-window-dimensions";

// COMP
const useScrollPosition = (enableAbovePixelWidth: number) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const { width } = useWindowDimensions();

  useLayoutEffect(() => {
    if (width < enableAbovePixelWidth) return;

    const updatePosition = () => {
      setScrollPosition(Math.floor(window.scrollY));
    };
    window.addEventListener("scroll", updatePosition);
    updatePosition();
    return () => window.removeEventListener("scroll", updatePosition);
  }, [enableAbovePixelWidth, width]);

  return scrollPosition;
};

export default useScrollPosition;
