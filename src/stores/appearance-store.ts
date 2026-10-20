"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppearanceState {
  liquidGlass: boolean;
  setLiquidGlass: (enabled: boolean) => void;
}

/** The real SDK is experimental; ordinary navigation always has a CSS fallback. */
export const useAppearanceStore = create<AppearanceState>()(persist(
  (set) => ({ liquidGlass: false, setLiquidGlass: (liquidGlass) => set({ liquidGlass }) }),
  {
    name: "kit-appearance",
    partialize: (state) => ({ liquidGlass: state.liquidGlass }),
    merge: (persisted, current) => ({
      ...current,
      liquidGlass: (persisted as Partial<AppearanceState> | null)?.liquidGlass === true,
    }),
  },
));
