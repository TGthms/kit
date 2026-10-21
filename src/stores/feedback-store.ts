"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hapticMode, type HapticMode } from "@/lib/feedback/haptics";

interface FeedbackState {
  haptics: HapticMode;
  setHaptics: (mode: HapticMode) => void;
}

export const useFeedbackStore = create<FeedbackState>()(persist(
  (set) => ({ haptics: "full", setHaptics: (haptics) => set({ haptics }) }),
  {
    name: "kit-feedback",
    partialize: (state) => ({ haptics: state.haptics }),
    merge: (persisted, current) => ({ ...current, haptics: hapticMode((persisted as Partial<FeedbackState> | null)?.haptics) }),
  },
));
