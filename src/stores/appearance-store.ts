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

/** Classic remains available as an explicit choice and a capability fallback. */
export const useAppearanceStore = create<AppearanceState>()(persist(
  (set) => ({
    liquidGlass: true,
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
        liquidGlass: typeof saved?.liquidGlass === "boolean" ? saved.liquidGlass : current.liquidGlass,
        glassTransparency: isGlassTransparency(saved?.glassTransparency)
          ? saved.glassTransparency : DEFAULT_GLASS_TRANSPARENCY,
      };
    },
  },
));
