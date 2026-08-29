"use client";

import NumberFlow, { NumberFlowGroup, type Format } from "@number-flow/react";
import { cn } from "@/lib/utils";

const twoDigitFormat: Format = { minimumIntegerDigits: 2 };

/**
 * Renders an animated H:MM:SS clock face.
 *
 * - Hours/minutes/seconds morph digit-by-digit via NumberFlow, grouped so
 *   their animations stay in sync.
 * - `trend={0}` keeps wraparound ticks (e.g. seconds 59 -> 00) from spinning
 *   the whole way around; digits just settle into place.
 * - An optional `fraction` (e.g. centiseconds) is rendered as plain, static
 *   text rather than animated, since sub-second digits change too fast for
 *   a flip/slide animation to read as anything but flicker.
 * - The animated digits are hidden from assistive tech; `label` supplies a
 *   single, clean accessible value for the whole clock instead.
 */
export function AnimatedClock({
  hours,
  minutes,
  seconds,
  fraction,
  label,
  className,
  digitClassName,
}: {
  hours?: number;
  minutes: number;
  seconds: number;
  fraction?: string;
  label: string;
  className?: string;
  digitClassName?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-center tabular-nums", className)} aria-label={label}>
      <span className="flex items-baseline" aria-hidden="true">
        <NumberFlowGroup>
          {hours !== undefined ? (
            <>
              <NumberFlow value={hours} format={twoDigitFormat} trend={0} className={digitClassName} />
              <span>:</span>
            </>
          ) : null}
          <NumberFlow value={minutes} format={twoDigitFormat} trend={0} className={digitClassName} />
          <span>:</span>
          <NumberFlow value={seconds} format={twoDigitFormat} trend={0} className={digitClassName} />
        </NumberFlowGroup>
        {fraction ? <span className="opacity-70">.{fraction}</span> : null}
      </span>
    </div>
  );
}
