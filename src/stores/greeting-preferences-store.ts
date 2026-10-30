"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GreetingPreferencesState {
  showObservances: boolean;
  setShowObservances: (enabled: boolean) => void;
}

export const useGreetingPreferencesStore = create<GreetingPreferencesState>()(
  persist(
    (set) => ({
      showObservances: true,
      setShowObservances: (showObservances) => set({ showObservances }),
    }),
    {
      name: "kit-greeting-preferences",
      partialize: (state) => ({ showObservances: state.showObservances }),
      merge: (persisted, current) => ({
        ...current,
        showObservances:
          (persisted as Partial<GreetingPreferencesState> | null)?.showObservances !== false,
      }),
    },
  ),
);
