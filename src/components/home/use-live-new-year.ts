"use client";

import { useEffect, useState } from "react";
import { getNewYearCardState, type NewYearCardState } from "@/lib/home/new-year";

/**
 * Local countdown clock. Home only passes a frozen phase snapshot so it does
 * not re-render 4×/s; this hook must keep `msLeft` in React state.
 *
 * Do not derive `getNewYearCardState(getNow())` during render. `getNow` is a
 * stable callback, and React Compiler would reuse the first snapshot forever.
 */
export function useLiveNewYearState(state: NewYearCardState, getNow: () => Date): NewYearCardState {
  const [live, setLive] = useState(state);

  if (state.phase !== live.phase || (state.phase !== "countdown" && state.year !== live.year)) {
    setLive(state);
  }

  useEffect(() => {
    if (state.phase !== "countdown") return;
    const id = window.setInterval(() => {
      setLive(getNewYearCardState(getNow()));
    }, 250);
    return () => window.clearInterval(id);
  }, [getNow, state.phase]);

  return live;
}
