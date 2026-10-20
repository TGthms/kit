"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GlassDiagnostic } from "@glass-sdk/liquid-glass";

export const GLASS_READY_TIMEOUT_MS = 8000;

/** A missing adapter or stalled material map must leave a usable control. */
export function useGlassHealth(waitOnMount = false) {
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = useRef(false);

  const clear = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const arm = useCallback(() => {
    if (timer.current !== null) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      setFailed(true);
    }, GLASS_READY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (waitOnMount && !ready.current) arm();
    return clear;
  }, [arm, clear, waitOnMount]);

  const onDiagnostic = useCallback(({ error, surfaces, maps }: GlassDiagnostic) => {
    if (error) {
      clear();
      setFailed(true);
      return;
    }
    // Switches/sliders create their material only while pressed; zero idle
    // surfaces are healthy. The tab bar needs its list and indicator ready.
    ready.current = maps === surfaces && (!waitOnMount || surfaces === 2);
    if (ready.current) clear();
    else if (surfaces > 0 || waitOnMount) arm();
  }, [arm, clear, waitOnMount]);

  return { failed, onDiagnostic };
}
