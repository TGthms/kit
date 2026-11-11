"use client";
import { Check, LoaderCircle } from "lucide-react";
/** A figure that has not been measured yet. */
export function Waiting({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <LoaderCircle aria-hidden className="h-3.5 w-3.5 shrink-0 animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** One figure on the status card, waiting in place of a value not yet read. */
export function Figure({ label, value, waiting }: { label: string; value: string | null; waiting: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-caption text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value ?? <Waiting label={waiting} />}</dd>
    </div>
  );
}

export function formatBytes(value: number | null, unknown: string): string {
  if (value === null || value < 0 || !Number.isFinite(value)) return unknown;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/** A tick marking something that works with the network off. */
export function ReadyTick({ label }: { label: string }) {
  return (
    <span className="shrink-0 text-primary">
      <Check aria-hidden className="h-3.5 w-3.5" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
