"use client";

// LIBS
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// UTILS
import useElementDimensions from "~/components/hooks/use-element-dimensions";
import useScrollPosition from "~/components/hooks/use-scroll-position";
import useWindowDimensions from "~/components/hooks/use-window-dimensions";
import { cn } from "~/lib/utils";

// ASSETS
import HelixNebula from "public/helix-nebula.webp";
import StarryParallax from "public/starry-parallax.jpg";

// CONSTS
const ENABLE_ABOVE_PIXEL_WIDTH = 1024;

// COMP
const ParallaxHero = ({ className = "" }: { className?: string }) => {
  const container = useRef<HTMLDivElement>(null);

  const { width } = useWindowDimensions();
  const scrollPosition = useScrollPosition(ENABLE_ABOVE_PIXEL_WIDTH);
  const { elementHeight } = useElementDimensions(container);
  const [parallaxTop, setParallaxTop] = useState(0);

  useEffect(() => {
    if (width < ENABLE_ABOVE_PIXEL_WIDTH) {
      return;
    }
    const handleParallaxPaddingTop = () => {
      if (scrollPosition > elementHeight) {
        setParallaxTop(elementHeight);
        return;
      }
      setParallaxTop(0 - scrollPosition);
    };
    handleParallaxPaddingTop();
    window.addEventListener("scroll", handleParallaxPaddingTop);
    return () => window.removeEventListener("scroll", handleParallaxPaddingTop);
  }, [elementHeight, scrollPosition, width]);

  return (
    <div
      ref={container}
      className={cn(
        `absolute left-0 top-0 h-full w-full overflow-hidden`,
        className,
      )}
    >
      <Image
        src={HelixNebula}
        alt="Aurora of lake - Ai generated background image"
        fill
        className={`w-full object-cover`}
      />
      <div
        className={`absolute inset-0 left-0 bg-slate-900/45 mix-blend-multiply`}
      />
      <Image
        src={StarryParallax}
        width={1920}
        height={1920}
        alt="Starry parallax effect"
        className={`absolute left-0 h-full min-h-[200vh] w-full object-cover opacity-70 mix-blend-screen`}
        style={{ top: `${parallaxTop}px` }}
      />
    </div>
  );
};

export default ParallaxHero;
