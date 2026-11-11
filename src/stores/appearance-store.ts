"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_GLASS_TRANSPARENCY, isGlassTransparency } from "@/lib/theme/glass-transparency";

interface AppearanceState {
  nightAppearance: boolean;
  setNightAppearance: (enabled: boolean) => void;
  liquidGlass: boolean;
  glassTransparency: number;
  setGlassTransparency: (percent: number) => void;
  setLiquidGlass: (enabled: boolean) => void;
}

/** Classic remains available as an explicit choice and a capability fallback. */
export const useAppearanceStore = create<AppearanceState>()(persist(
  (set) => ({
    nightAppearance: true,
    setNightAppearance: (nightAppearance) => set({ nightAppearance }),
    liquidGlass: true,
    glassTransparency: DEFAULT_GLASS_TRANSPARENCY,
    setLiquidGlass: (liquidGlass) => set({ liquidGlass }),
    setGlassTransparency: (glassTransparency) => {
      if (isGlassTransparency(glassTransparency)) set({ glassTransparency });
    },
  }),
  {
    name: "kit-appearance",
    partialize: ({ liquidGlass, glassTransparency, nightAppearance }) => ({ liquidGlass, glassTransparency, nightAppearance }),
    merge: (persisted, current) => {
      const saved = persisted as Partial<AppearanceState> | null;
      return {
        ...current,
        nightAppearance: typeof saved?.nightAppearance === "boolean" ? saved.nightAppearance : true,
        liquidGlass: typeof saved?.liquidGlass === "boolean" ? saved.liquidGlass : current.liquidGlass,
        glassTransparency: isGlassTransparency(saved?.glassTransparency)
          ? saved.glassTransparency : DEFAULT_GLASS_TRANSPARENCY,
      };
    },
  },
));
