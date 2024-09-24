"use client";

// LIBRARIES
import { create } from "zustand";

// UTILS
import {
  COLOR_THEMES,
  type ColorTheme,
  LD_THEMES,
  type LdTheme,
} from "~/server/db/schema";

// COMPONENTS

export interface ThemeStoreType {
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
  colorThemeList: ColorTheme[];
  ldTheme: LdTheme;
  setLdTheme: (ldTheme: LdTheme) => void;
}

const useThemeStore = create<ThemeStoreType>((set) => ({
  colorTheme: COLOR_THEMES[5],
  setColorTheme: (colorTheme) => {
    set(() => ({
      colorTheme,
    }));
    window.localStorage.setItem("theme", colorTheme);
  },
  colorThemeList: [...COLOR_THEMES],
  ldTheme: LD_THEMES[1],
  setLdTheme: (ldTheme) => {
    set(() => ({
      ldTheme,
    }));
    window.localStorage.setItem("ld-theme", ldTheme);
  },
}));

export default useThemeStore;
