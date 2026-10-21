"use client";

import { useEffect } from "react";
import { installHaptics } from "@/lib/feedback/haptics";
import { useFeedbackStore } from "@/stores/feedback-store";

export function HapticFeedback() {
  const mode = useFeedbackStore((state) => state.haptics);
  useEffect(() => installHaptics(() => useFeedbackStore.getState().haptics), [mode]);
  return null;
}
