"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_GLASS_TRANSPARENCY, isGlassTransparency } from "@/lib/theme/glass-transparency";

interface AppearanceState {
  liquidGlass: boolean;
  glassTransparency: number;
  setGlassTransparency: (percent: number) => void;
  setLiquidGlass: (enabled: boolean) => void;
}

/** The real SDK is experimental; ordinary navigation always has a CSS fallback. */
export const useAppearanceStore = create<AppearanceState>()(persist(
  (set) => ({
    liquidGlass: false,
    glassTransparency: DEFAULT_GLASS_TRANSPARENCY,
    setLiquidGlass: (liquidGlass) => set({ liquidGlass }),
    setGlassTransparency: (glassTransparency) => {
      if (isGlassTransparency(glassTransparency)) set({ glassTransparency });
    },
  }),
  {
    name: "kit-appearance",
    partialize: ({ liquidGlass, glassTransparency }) => ({ liquidGlass, glassTransparency }),
    merge: (persisted, current) => {
      const saved = persisted as Partial<AppearanceState> | null;
      return {
        ...current,
        liquidGlass: saved?.liquidGlass === true,
        glassTransparency: isGlassTransparency(saved?.glassTransparency)
          ? saved.glassTransparency : DEFAULT_GLASS_TRANSPARENCY,
      };
    },
  },
));
