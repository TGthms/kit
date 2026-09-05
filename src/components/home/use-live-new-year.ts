"use client";

import { useEffect, useState } from "react";
import { getNewYearCardState, type NewYearCardState } from "@/lib/home/new-year";

/**
 * Local countdown clock. Home only passes a frozen phase snapshot so it does
 * not re-render 4×/s; this hook must keep `msLeft` in React state.
 *
 * Do not derive `getNewYearCardState(getNow())` during render. `getNow` is a
 * stable callback, and React Compiler would reuse the first snapshot forever.
 *
 * Never copy a parent `countdown` snapshot over a live `celebrate` — that
 * snapshot is the time the tab opened, not now. Remount the card when the
 * `date` / `time` query changes so a preview rewind still resets.
 */
export function useLiveNewYearState(state: NewYearCardState, getNow: () => Date): NewYearCardState {
  const [live, setLive] = useState(state);

  if (state.phase !== "countdown" && (live.phase !== state.phase || live.year !== state.year)) {
    setLive(state);
  }

  useEffect(() => {
    if (state.phase !== "countdown") return;
    const id = window.setInterval(() => {
      const next = getNewYearCardState(getNow());
      setLive(next);
      if (next.phase !== "countdown") window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [getNow, state.phase]);

  return live;
}
