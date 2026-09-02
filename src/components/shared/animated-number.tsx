"use client";

import { createElement, type ReactNode } from "react";
import Scritto, { type Trend } from "@scritto/react";
import { cn } from "@/lib/utils";

/** Live numeric values that should morph. Clock faces use AnimatedClock. */
export function AnimatedNumber({
  value,
  format,
  className,
  suffix,
  trend = 0,
}: {
  value: number;
  format?: Intl.NumberFormatOptions;
  className?: string;
  suffix?: string;
  trend?: Trend;
}) {
  if (!Number.isFinite(value)) {
    return <span className={className}>—</span>;
  }

  const formatted = new Intl.NumberFormat(undefined, format).format(value);
  const roll = (
    <Scritto
      value={formatted}
      trend={trend}
      className="tabular-nums"
      style={{ fontVariantNumeric: "tabular-nums" }}
    />
  );

  return (
    <span className={cn("inline-flex items-baseline tabular-nums", className)}>
      {suffix ? <ScrittoFlow>{roll}{suffix}</ScrittoFlow> : roll}
    </span>
  );
}

function ScrittoFlow({ children }: { children: ReactNode }) {
  return createElement("scritto-flow", { className: "kit-scritto-inline" }, children);
}
