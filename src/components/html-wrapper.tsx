"use client";

// LIBRARIES
import { useTheme } from "next-themes";
import { type Session } from "node_modules/next-auth/core/types";
import { type ReactNode, useLayoutEffect, useState } from "react";
import { themeChange } from "theme-change";

// UTILS

// COMPONENTS
import { type ColorTheme } from "~/server/db/schema";

type Props = {
  children: ReactNode;
  session: Session | null;
};

const HtmlWrapper = ({ children, session }: Props) => {
  // Color Mode
  const { theme: LdTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorTheme>("galaxy");

  // No SSR for themeChange
  useLayoutEffect(() => {
    themeChange(false);
  }, []);

  // Change colorTheme based on session
  useLayoutEffect(() => {
    if (session?.user?.colorTheme) {
      setColorTheme(session.user.colorTheme);
    }
  }, [session]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={colorTheme}
      className={LdTheme}
    >
      {children}
    </html>
  );
};
export default HtmlWrapper;
