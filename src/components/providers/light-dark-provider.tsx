"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

const LdThemes = ["light", "dark"] as const;
const DEFAULT_LD_THEME: (typeof LdThemes)[number] = "dark";

const LightDarkProvider = ({ children, ...Props }: ThemeProviderProps) => {
  // set default LD theme
  React.useEffect(() => {
    const localLdTheme = window.localStorage.getItem("ld-theme");
    if (
      localLdTheme === null ||
      !LdThemes.includes(localLdTheme as (typeof LdThemes)[number])
    ) {
      window.localStorage.setItem("ld-theme", DEFAULT_LD_THEME);
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_LD_THEME}
      storageKey="ld-theme"
    >
      {children}
    </NextThemesProvider>
  );
};

export default LightDarkProvider;
