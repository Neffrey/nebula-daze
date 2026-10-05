"use client";

import { useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { applyTheme, readStoredTheme, writeStoredTheme } from "@/lib/theme";

export default function ThemeSync() {
  const viewer = useQuery(api.users.viewer);

  useEffect(() => {
    if (viewer === undefined) {
      const stored = readStoredTheme();
      if (stored) {
        applyTheme(stored);
      }
      return;
    }

    const theme = viewer?.theme ?? readStoredTheme() ?? "light";
    applyTheme(theme);
    writeStoredTheme(theme);
  }, [viewer]);

  return null;
}
