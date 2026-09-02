"use client";

import Scritto, { type Trend } from "@scritto/react";
import { cn } from "@/lib/utils";
import { clockFace } from "./clock-face";

/**
 * Renders an animated H:MM:SS clock face.
 *
 * Scritto diffs the formatted string, so colons stay put and only glyphs that
 * changed roll. Feed the padded face (`01:23:45`), never the raw numbers —
 * grouping characters are what keep the columns stable.
 *
 * - `trend` should be `-1` while a countdown is running and `+1` while a
 *   stopwatch is running. Idle/reset uses `0` so direction is read off the value.
 * - An optional `fraction` (e.g. centiseconds) is static: sub-second ticks are
 *   faster than a roll, and stacking ghosts is unreadable.
 * - The animated digits are hidden from assistive tech; `label` supplies a
 *   single accessible value for the whole clock.
 */

export function AnimatedClock({
  hours,
  minutes,
  seconds,
  fraction,
  label,
  className,
  digitClassName,
  animate = true,
  trend = 0,
}: {
  hours?: number;
  minutes: number;
  seconds: number;
  fraction?: string;
  label: string;
  className?: string;
  digitClassName?: string;
  animate?: boolean;
  trend?: Trend;
}) {
  const face = clockFace(hours, minutes, seconds);

  return (
    <div
      className={cn("flex items-baseline justify-center tabular-nums", className)}
      style={{ fontVariantNumeric: "tabular-nums" }}
      aria-label={label}
    >
      <span className="flex items-baseline" aria-hidden="true">
        <Scritto
          value={face}
          trend={trend}
          animated={animate}
          className={digitClassName}
        />
        {fraction ? <span className="opacity-70">.{fraction}</span> : null}
      </span>
    </div>
  );
}
