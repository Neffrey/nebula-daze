"use client";

// LIBRARIES
import { create } from "zustand";

// UTILS
import { COLOR_THEMES, type ColorTheme } from "~/server/db/schema";

export interface ThemeStoreType {
  isOpen: boolean;
  currentTheme: ColorTheme;
  themeList: ColorTheme[];
  setCurrentTheme: (current: ColorTheme) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleDrawer: () => void;
}

const useThemeStore = create<ThemeStoreType>((set, get) => ({
  isOpen: false,
  currentTheme: "galaxy",
  themeList: [...COLOR_THEMES],
  setCurrentTheme: (current) => {
    set(() => ({
      currentTheme: current,
    }));
    window.localStorage.setItem("theme", current);
  },
  setIsOpen: (isOpen) => {
    set(() => ({
      isOpen,
    }));
  },
  toggleDrawer: () => {
    set(() => ({
      isOpen: !get().isOpen,
    }));
  },
}));

export default useThemeStore;
