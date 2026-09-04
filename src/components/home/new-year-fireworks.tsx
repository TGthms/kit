"use client";

import { useEffect, useRef } from "react";
import { NEW_YEAR_FIREWORKS_MS } from "@/lib/home/new-year";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Full-viewport fireworks for the New Year flip.
 * Runs at most NEW_YEAR_FIREWORKS_MS, ignores pointer, sits under chrome.
 */
export function NewYearFireworks({
  active,
  durationMs = NEW_YEAR_FIREWORKS_MS,
}: {
  active: boolean;
  /** How long to run after this activation; parent freezes this when `active` turns on. */
  durationMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || durationMs <= 0) return;
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    let cancelled = false;
    let stopTimer = 0;
    let fireworks: { start: () => void; stop: (dispose?: boolean) => void; launch: (count: number) => void } | null = null;

    const onVisibility = () => {
      if (!fireworks) return;
      if (document.hidden) fireworks.stop();
      else fireworks.start();
    };

    void import("fireworks-js").then(({ Fireworks }) => {
      if (cancelled || !root) return;
      fireworks = new Fireworks(root, {
        autoresize: true,
        opacity: 0.88,
        acceleration: 1.02,
        friction: 0.97,
        gravity: 1.4,
        particles: 55,
        explosion: 4,
        intensity: 28,
        flickering: 55,
        lineStyle: "round",
        hue: { min: 10, max: 48 },
        rocketsPoint: { min: 20, max: 80 },
        lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 0.8, max: 1.8 } },
        brightness: { min: 58, max: 88 },
        decay: { min: 0.012, max: 0.028 },
        mouse: { click: false, move: false, max: 1 },
        sound: { enabled: false, files: [], volume: { min: 0, max: 0 } },
        traceSpeed: 8,
      });
      fireworks.start();
      fireworks.launch(10);
      document.addEventListener("visibilitychange", onVisibility);
      stopTimer = window.setTimeout(() => {
        fireworks?.stop(true);
      }, durationMs);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(stopTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      fireworks?.stop(true);
    };
  }, [active, durationMs]);

  if (!active) return null;

  return <div ref={ref} className="kit-new-year-fireworks" aria-hidden="true" />;
}
