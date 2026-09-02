"use client";

import { useState, type ComponentType, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { GlidingPill, useGlidingPill } from "./gliding-pill";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T, event: MouseEvent<HTMLButtonElement>) => void;
  options: { value: T; label: string; icon?: ComponentType<{ className?: string }> }[];
  "aria-label"?: string;
  className?: string;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLButtonElement | null>(null);
  const { rect, ready } = useGlidingPill(container, target);

  return (
    <div
      ref={setContainer}
      role="tablist"
      aria-label={ariaLabel}
      className={cn("relative inline-flex max-w-full rounded-2xl bg-secondary/80 p-1", className)}
    >
      <GlidingPill
        rect={rect}
        ready={ready}
        className="rounded-xl bg-background shadow-sm ring-1 ring-border/50"
      />
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (selected && el) setTarget(el);
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "relative z-10 inline-flex min-h-9 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium",
              "transition-colors duration-200 motion-reduce:transition-none",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(event) => onChange(option.value, event)}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
