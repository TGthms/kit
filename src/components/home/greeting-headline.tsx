"use client";

import { useEffect, useMemo, useState } from "react";
import { segmentGraphemes, typewriterIntervalMs } from "@/lib/home/typewriter";
import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GreetingHeadline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const graphemes = useMemo(() => segmentGraphemes(text), [text]);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [typedFor, setTypedFor] = useState(text);
  const [shownCount, setShownCount] = useState(0);
  if (typedFor !== text) {
    setTypedFor(text);
    setShownCount(0);
  }

  useEffect(() => {
    if (reducedMotion) return;
    if (graphemes.length === 0) return;
    const interval = typewriterIntervalMs(graphemes.length);
    let count = 0;
    let timer = 0;
    const tick = () => {
      count += 1;
      setShownCount(count);
      if (count < graphemes.length) timer = window.setTimeout(tick, interval);
    };
    timer = window.setTimeout(tick, interval);
    return () => window.clearTimeout(timer);
  }, [graphemes, reducedMotion, text]);

  const done = reducedMotion || graphemes.length === 0 || shownCount >= graphemes.length;
  const visible = done ? text : graphemes.slice(0, shownCount).join("");

  return (
    <h1 className={cn(className)} aria-label={text}>
      <span className="greeting-typewriter" aria-hidden="true">
        <span className="greeting-typewriter-sizer">{text}</span>
        <span className="greeting-typewriter-live">
          {visible}
          {done ? null : <span className="greeting-caret" />}
        </span>
      </span>
    </h1>
  );
}
