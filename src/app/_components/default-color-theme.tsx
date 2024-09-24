"use client";

// LIBS
import { useSession } from "next-auth/react";
import { useEffect } from "react";

// UTILS
import useThemeStore from "~/components/stores/theme-store";
import { api } from "~/trpc/react";

// COMPONENTS
import { COLOR_THEMES, type ColorTheme } from "~/server/db/schema";

// COMP
const DefaultThemes = () => {
  const { data: session, update: updateSession } = useSession();

  const setColorTheme = useThemeStore((state) => state.setColorTheme);

  const editUser = api.users.edit.useMutation({
    onSuccess: () => {
      void updateSession();
    },
  });

  useEffect(() => {
    const localColorTheme = window.localStorage.getItem("theme") as ColorTheme;

    // setColorTheme if user is not authed
    if (!session?.user?.colorTheme) {
      if (localColorTheme && COLOR_THEMES.includes(localColorTheme)) {
        setColorTheme(localColorTheme);
      }
      if (!localColorTheme) {
        setColorTheme(COLOR_THEMES[5]);
      }
    }
  }, [setColorTheme, editUser, session?.user]);

  return null;
};

export default DefaultThemes;
