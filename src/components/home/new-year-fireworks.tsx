"use client";

import { useEffect, useRef } from "react";
import { NEW_YEAR_FIREWORKS_MS } from "@/lib/home/new-year";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type FireworksHandle = {
  start: () => void;
  stop: (dispose?: boolean) => void;
  waitStop: (dispose?: boolean) => Promise<void>;
  updateSize: () => void;
};

/**
 * Full-viewport fireworks for the New Year flip.
 * `start()` keeps launching for durationMs; do not call `launch()` — that one-shots
 * then waitStop, so initTrace never spawns again.
 */
export function NewYearFireworks({
  active,
  durationMs = NEW_YEAR_FIREWORKS_MS,
}: {
  active: boolean;
  /** How long to keep launching after this activation; parent freezes this when `active` turns on. */
  durationMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || durationMs <= 0) return;
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    let cancelled = false;
    let stopTimer = 0;
    let fireworks: FireworksHandle | null = null;

    const onVisibility = () => {
      if (!fireworks) return;
      if (document.hidden) fireworks.stop();
      else fireworks.start();
    };

    void import("fireworks-js").then(({ Fireworks }) => {
      if (cancelled || !root) return;
      fireworks = new Fireworks(root, {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 50,
        explosion: 5,
        intensity: 30,
        flickering: 50,
        lineStyle: "round",
        hue: { min: 0, max: 360 },
        delay: { min: 15, max: 30 },
        rocketsPoint: { min: 10, max: 90 },
        lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } },
        brightness: { min: 50, max: 80 },
        decay: { min: 0.015, max: 0.03 },
        mouse: { click: false, move: false, max: 1 },
        sound: { enabled: false, files: [], volume: { min: 0, max: 0 } },
        traceLength: 3,
        traceSpeed: 10,
      }) as FireworksHandle;
      fireworks.start();
      fireworks.updateSize();
      document.addEventListener("visibilitychange", onVisibility);
      stopTimer = window.setTimeout(() => {
        void fireworks?.waitStop(true);
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
