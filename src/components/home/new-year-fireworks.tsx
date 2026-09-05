"use client";

import { useEffect, useRef } from "react";
import { NEW_YEAR_BURST_ROCKETS, NEW_YEAR_FIREWORKS_MS } from "@/lib/home/new-year";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type FireworksHandle = {
  start: () => void;
  stop: (dispose?: boolean) => void;
  waitStop: (dispose?: boolean) => Promise<void>;
  pause: () => void;
  launch: (count?: number) => void;
  updateSize: () => void;
  readonly isRunning: boolean;
};

const FIREWORKS_OPTIONS = {
  autoresize: true,
  opacity: 0.5,
  acceleration: 1.05,
  friction: 0.97,
  gravity: 1.5,
  particles: 50,
  explosion: 5,
  intensity: 30,
  flickering: 50,
  lineStyle: "round" as const,
  hue: { min: 0, max: 360 },
  delay: { min: 15, max: 30 },
  rocketsPoint: { min: 10, max: 90 },
  lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } },
  brightness: { min: 50, max: 80 },
  decay: { min: 0.015, max: 0.03 },
  mouse: { click: false, move: false, max: 1 },
  sound: { enabled: false, files: [] as string[], volume: { min: 0, max: 0 } },
  traceLength: 3,
  traceSpeed: 10,
};

/**
 * Full-viewport fireworks.
 * - `continuous`: `start()` for durationMs (midnight window). Do not `launch()`.
 * - `burst`: one `launch()` volley when landing on 1 Jan after that window.
 * Hide/show uses `pause()`, not `stop()`, so a tab switch does not clear the canvas
 * and then `start()` after `waitStop` has already finished.
 */
export function NewYearFireworks({
  continuous,
  burst,
  durationMs = NEW_YEAR_FIREWORKS_MS,
}: {
  continuous: boolean;
  burst: boolean;
  durationMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = continuous || burst;

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const mode = continuous ? "continuous" : "burst";
    let cancelled = false;
    let finished = false;
    let stopTimer = 0;
    let fireworks: FireworksHandle | null = null;

    const onVisibility = () => {
      if (!fireworks || finished) return;
      if (document.hidden) {
        if (fireworks.isRunning) fireworks.pause();
        return;
      }
      if (!fireworks.isRunning) fireworks.pause();
    };

    void import("fireworks-js").then(({ Fireworks }) => {
      if (cancelled || !root.isConnected) return;
      fireworks = new Fireworks(root, FIREWORKS_OPTIONS) as FireworksHandle;
      fireworks.updateSize();
      document.addEventListener("visibilitychange", onVisibility);
      if (mode === "burst") {
        fireworks.launch(NEW_YEAR_BURST_ROCKETS);
        void fireworks.waitStop(true).then(() => {
          finished = true;
        });
        return;
      }
      fireworks.start();
      stopTimer = window.setTimeout(() => {
        finished = true;
        void fireworks?.waitStop(true);
      }, durationMs);
    });

    return () => {
      cancelled = true;
      finished = true;
      window.clearTimeout(stopTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      fireworks?.stop(true);
    };
  }, [active, burst, continuous, durationMs]);

  return (
    <div
      ref={ref}
      className="kit-new-year-fireworks"
      data-active={active ? "true" : "false"}
      aria-hidden="true"
    />
  );
}
