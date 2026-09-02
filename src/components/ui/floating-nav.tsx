"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating capsule chrome for the mobile/PWA tab bar.
 * Content scrolls underneath; the wrap does not steal taps around the pill.
 */
export function FloatingNav({
  children,
  className,
  contentClassName,
  contentRef,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  contentRef?: (node: HTMLDivElement | null) => void;
  "aria-label"?: string;
}) {
  return (
    <nav
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 md:hidden",
        "bottom-[var(--floating-tabbar-offset)]",
        className
      )}
      aria-label={ariaLabel}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-lg px-3">
        <div className="floating-nav-shell rounded-full">
          <div
            ref={contentRef}
            className={cn(
              "glass-heavy chrome-touch floating-nav-face relative flex items-stretch justify-around",
              "overflow-hidden rounded-full border px-1.5 py-1.5",
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </nav>
  );
}
