"use client";

// LIBS
import { useSession } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useLayoutEffect } from "react";

// UTILS
import useThemeStore from "~/components/stores/theme-store";
import { type LdTheme, LD_THEMES } from "~/server/db/schema";

const LightDarkProvider = ({ children }: ThemeProviderProps) => {
  const ldTheme = useThemeStore((state) => state.ldTheme);
  const setLdTheme = useThemeStore((state) => state.setLdTheme);

  const { data: session } = useSession();

  const checkIsDarkSchemePreferred = () =>
    window?.matchMedia?.("(prefers-color-scheme:dark)")?.matches ?? false;

  // set default LD theme
  useLayoutEffect(() => {
    const localLdTheme = window?.localStorage?.getItem("ld-theme") as LdTheme;

    // setLdTheme if user is not authed
    if (!session?.user?.ldTheme) {
      if (localLdTheme && LD_THEMES.includes(localLdTheme)) {
        setLdTheme(localLdTheme);
      }
      if (!localLdTheme) {
        if (checkIsDarkSchemePreferred()) {
          setLdTheme(LD_THEMES[2]);
        } else {
          setLdTheme(LD_THEMES[1]);
        }
      }
    }
  }, [session, ldTheme, setLdTheme]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={ldTheme}
      storageKey="ld-theme"
    >
      {children}
    </NextThemesProvider>
  );
};

export default LightDarkProvider;
