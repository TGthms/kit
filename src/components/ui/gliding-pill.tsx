"use client";

import { useLayoutEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type PillRect = { left: number; top: number; width: number; height: number };

export function measurePill(container: HTMLElement, target: HTMLElement): PillRect {
  const c = container.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  // `left`/`top` on the absolutely positioned pill resolve against the
  // container's padding box, while getBoundingClientRect() reports the border
  // box. Subtract the border so the measured box and the CSS fallback describe
  // the same coordinate space.
  const borderLeft = container.clientLeft || 0;
  const borderTop = container.clientTop || 0;
  return {
    left: t.left - c.left - borderLeft,
    top: t.top - c.top - borderTop,
    width: t.width,
    height: t.height,
  };
}

function sameRect(a: PillRect, b: PillRect): boolean {
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

export function useGlidingPill(container: HTMLElement | null, target: HTMLElement | null) {
  const [rect, setRect] = useState<PillRect>({ left: 0, top: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!container || !target) return;

    let frame = 0;
    const commit = () => {
      frame = 0;
      const next = measurePill(container, target);
      if (next.width === 0) return;
      setRect((current) => (sameRect(current, next) ? current : next));
      setReady(true);
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(commit);
    };

    // Measure once synchronously so `ready` is already true at the first paint.
    // `ready` is what lifts `.gliding-pill:not([data-ready]) { transition: none }`,
    // so deferring this to a frame left the pill unable to animate during the
    // first paint — a tab switch in that window jumped instead of gliding.
    // Later ResizeObserver/resize updates still coalesce into a single frame.
    commit();
    const ro = new ResizeObserver(scheduleUpdate);
    ro.observe(container);
    ro.observe(target);
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.cancelAnimationFrame(frame);
    };
  }, [container, target]);

  return { rect, ready };
}

export function GlidingPill({
  rect,
  ready,
  hydrated = true,
  fallbackIndex,
  fallbackCount,
  className,
}: {
  rect: PillRect;
  ready: boolean;
  hydrated?: boolean;
  fallbackIndex?: number;
  fallbackCount?: number;
  className?: string;
}) {
  const style: CSSProperties = ready
    ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    : {};
  const hasFallback = fallbackIndex !== undefined && fallbackCount !== undefined && fallbackCount > 0;
  const fallbackStyle = hasFallback
    ? ({
        "--gliding-pill-index": fallbackIndex,
        "--gliding-pill-count": fallbackCount,
      } as CSSProperties)
    : {};
  return (
    <span
      aria-hidden
      data-ready={ready ? "" : undefined}
      data-hydrated={hydrated ? "" : undefined}
      style={hasFallback ? { ...style, ...fallbackStyle } : style}
      className={cn("gliding-pill pointer-events-none absolute", hasFallback && "gliding-pill-fallback", className)}
    />
  );
}
