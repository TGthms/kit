"use client";

import { useLayoutEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type PillRect = { left: number; top: number; width: number; height: number };

export function measurePill(container: HTMLElement, target: HTMLElement): PillRect {
  const c = container.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  return {
    left: t.left - c.left,
    top: t.top - c.top,
    width: t.width,
    height: t.height,
  };
}

export function useGlidingPill(container: HTMLElement | null, target: HTMLElement | null) {
  const [rect, setRect] = useState<PillRect>({ left: 0, top: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!container || !target) return;

    const update = () => {
      if (target.getBoundingClientRect().width === 0) return;
      setRect(measurePill(container, target));
      setReady(true);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(target);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [container, target]);

  return { rect, ready };
}

export function GlidingPill({
  rect,
  ready,
  className,
}: {
  rect: PillRect;
  ready: boolean;
  className?: string;
}) {
  const style: CSSProperties = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
  return (
    <span
      aria-hidden
      data-ready={ready ? "" : undefined}
      className={cn("gliding-pill pointer-events-none absolute", className)}
      style={style}
    />
  );
}
