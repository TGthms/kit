"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import { cn } from "@/lib/utils";

/** Live numeric values that should morph. Not for world-clock faces. */
export function AnimatedNumber({
  value,
  format,
  className,
  suffix,
}: {
  value: number;
  format?: Format;
  className?: string;
  suffix?: string;
}) {
  if (!Number.isFinite(value)) {
    return <span className={className}>—</span>;
  }
  return (
    <span className={cn("inline-flex items-baseline tabular-nums", className)}>
      <NumberFlow value={value} format={format} />
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}
