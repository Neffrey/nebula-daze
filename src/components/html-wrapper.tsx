"use client";

// LIBS
import { useTheme } from "next-themes";
import { type NextFontWithVariable } from "next/dist/compiled/@next/font";
import { type Session } from "node_modules/next-auth/core/types";
import { type ReactNode, useLayoutEffect } from "react";
import { themeChange } from "theme-change";

// UTILS
import useThemeStore from "~/components/stores/theme-store";

// COMPONENTS

type Props = {
  children: ReactNode;
  session: Session | null;
  fonts?: NextFontWithVariable[];
};

const HtmlWrapper = ({ children, session, fonts }: Props) => {
  // Color Mode
  const { theme: LdTheme } = useTheme();
  const colorTheme = useThemeStore((state) => state.colorTheme);
  const setColorTheme = useThemeStore((state) => state.setColorTheme);

  // No SSR for themeChange
  useLayoutEffect(() => {
    themeChange(false);
  }, []);

  // Change colorTheme based on session
  useLayoutEffect(() => {
    if (session?.user?.colorTheme) {
      setColorTheme(session.user.colorTheme);
    }
  }, [session, setColorTheme]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={colorTheme}
      // className={LdTheme}
      className={`${LdTheme} ${fonts?.map((font) => font.variable).join(" ")}`}
    >
      {children}
    </html>
  );
};
export default HtmlWrapper;
