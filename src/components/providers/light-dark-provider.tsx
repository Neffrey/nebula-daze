"use client";

// LIBS
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
// import { type UserSession } from "~/server/auth";
// import { type Session } from "next-auth";
import { type Session } from "node_modules/next-auth/core/types";
import { useLayoutEffect, useState } from "react";

// UTILS
import { type LdTheme, ldThemes } from "~/server/db/schema";

// CONSTS
const DEFAULT_LD_THEME = ldThemes[0];

interface LightDarkProviderProps extends ThemeProviderProps {
  session: Session | null;
}

const LightDarkProvider = ({ children, session }: LightDarkProviderProps) => {
  const [ldTheme, setLdTheme] = useState<LdTheme>(DEFAULT_LD_THEME);

  // set default LD theme
  useLayoutEffect(() => {
    if (session?.user?.ldTheme) {
      setLdTheme(session.user.ldTheme);
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
