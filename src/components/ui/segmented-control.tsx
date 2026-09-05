"use client";

import { useRef, useState, type ComponentType, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { GlidingPill, useGlidingPill } from "./gliding-pill";

type ActivateEvent = MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>;

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T, event?: ActivateEvent) => void;
  options: { value: T; label: string; icon?: ComponentType<{ className?: string }> }[];
  "aria-label"?: string;
  className?: string;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLButtonElement | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const { rect, ready } = useGlidingPill(container, target);

  function activate(index: number, event?: ActivateEvent) {
    const option = options[index];
    if (!option) return;
    if (option.value !== value) onChange(option.value, event);
    buttons.current[index]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    const rtl =
      (container && getComputedStyle(container).direction === "rtl") ||
      (typeof document !== "undefined" && document.documentElement.dir === "rtl");
    const last = options.length - 1;
    let next = index;
    if (event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
      next = (index + 1) % options.length;
    } else if (event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
      next = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = last;
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      activate(index, event);
      return;
    } else {
      return;
    }
    event.preventDefault();
    activate(next, event);
  }

  return (
    <div
      ref={setContainer}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("relative inline-flex max-w-full rounded-2xl bg-secondary/80 p-1", className)}
    >
      <GlidingPill
        rect={rect}
        ready={ready}
        className="rounded-xl bg-background shadow-sm ring-1 ring-border/50"
      />
      {options.map((option, index) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[index] = el;
              if (selected && el) setTarget(el);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={cn(
              "relative z-10 inline-flex min-h-9 items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium",
              "transition-colors duration-200 motion-reduce:transition-none",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={(event) => {
              if (option.value === value) return;
              onChange(option.value, event);
            }}
            onKeyDown={(event) => onKeyDown(index, event)}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
