"use client";

import { useState, type ReactNode } from "react";
import type { SubtitleMotion } from "@/lib/home/subtitle-motion";
import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GreetingSubtitle({
  motion,
  play,
  className,
  children,
}: {
  motion: SubtitleMotion;
  play: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [reducedMotion] = useState(prefersReducedMotion);
  const ready = reducedMotion || play;

  return (
    <p
      className={cn(
        className,
        "greeting-sub",
        reducedMotion && "greeting-sub--instant",
        ready && !reducedMotion && `greeting-sub--${motion}`,
      )}
    >
      {children}
    </p>
  );
}
