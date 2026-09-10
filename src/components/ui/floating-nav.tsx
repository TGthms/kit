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
  keyboardHidden,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  contentRef?: (node: HTMLDivElement | null) => void;
  keyboardHidden?: boolean;
  "aria-label"?: string;
}) {
  return (
    <nav
      className={cn(
        "floating-nav pointer-events-none fixed inset-x-0 z-40 md:hidden",
        "bottom-[var(--floating-tabbar-offset)]",
        className
      )}
      aria-label={ariaLabel}
      aria-hidden={keyboardHidden ? true : undefined}
      inert={keyboardHidden || undefined}
      data-keyboard={keyboardHidden ? "" : undefined}
    >
      <div className="pointer-events-none mx-auto flex w-full max-w-lg justify-center px-3">
        <div className="pointer-events-auto floating-nav-shell w-full rounded-full">
          <div
            ref={contentRef}
            className={cn(
              "chrome-touch floating-nav-face relative flex items-stretch justify-around",
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
