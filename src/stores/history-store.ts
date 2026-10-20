"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resolveToolId, type ToolId } from "@/lib/tools/registry";

export interface HistoryEntry {
  id: string;
  /** May include legacy ids; resolve with getTool/resolveToolId. */
  toolId: ToolId | string;
  timestamp: number;
  summary: string;
  status: "success" | "failed";
  options?: Record<string, unknown>;
}

interface HistoryState {
  entries: HistoryEntry[];
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  add: (entry: Omit<HistoryEntry, "id" | "timestamp"> & { timestamp?: number }) => void;
  clear: () => void;
}

export function safeSummary(summary: string, status: HistoryEntry["status"]): string {
  if (status === "failed" || /fail|error|cancel/i.test(summary)) return "failed";
  const normalized = summary.trim().replace(/\s+/gu, " ");
  if (/^(?:completed|success)$/i.test(normalized)) return "completed";
  if (normalized.length > 96) return "completed";
  /* Only compact operation metadata survives. Free-form filenames, watermark
     text, ranges, and pasted input are all reduced to "completed". */
  if (/^\d+(?:\.\d+)?(?: (?:files|images|pages|sizes))?$/i.test(normalized)) return normalized;
  if (/^\d+ words, \d+ characters$/i.test(normalized)) return normalized;
  if (/^BMI \d+(?:\.\d+)? · \d+ kcal$/u.test(normalized)) return normalized;
  if (/^(?:q|speed|count|n)=\d+(?:\.\d+)?(?: (?:q|speed|count|n)=\d+(?:\.\d+)?)*$/i.test(normalized)) {
    return normalized;
  }
  if (/^\d+:\d{2}:\d{2}(?:\.\d+)?$/u.test(normalized)) return normalized;
  if (/^(?:integer|decimal|boolean)(?::| × )/iu.test(normalized)) return normalized;
  if (/^pick × \d+$/iu.test(normalized)) return normalized;
  if (/^password(?: × \d+)?$/iu.test(normalized)) return normalized;
  if (/^(?:md|html|csv|json)→(?:md|html|csv|json)$/iu.test(normalized)) return normalized;
  if (/^[a-z0-9+\-]+→[a-z0-9+\-]+$/iu.test(normalized) && !/\./u.test(normalized)) return normalized;
  if (
    /^(?:[\d.]+(?:\s+[A-Za-z0-9µμ°/%²³²³+\-]+)?|[A-Z]{3})\s+→\s+(?:[\d.]+(?:\s+[A-Za-z0-9µμ°/%²³²³+\-]+)?|[A-Z]{3})$/u.test(
      normalized
    )
  ) {
    return normalized;
  }
  /* Paired identifiers such as `image/png → image/jpeg` or
     `America/New_York → Europe/London`. A dot marks a filename, and a filename
     is never stored, so it is excluded from the accepted characters. */
  if (/^[A-Za-z0-9_+\-/]+ → [A-Za-z0-9_+\-/]+$/u.test(normalized)) {
    return normalized;
  }
  return "completed";
}

function safeOptions(options: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!options || typeof options !== "object" || Array.isArray(options)) return undefined;
  const safe = Object.fromEntries(
    Object.entries(options).filter(([, value]) =>
      (typeof value === "number" && Number.isFinite(value)) || typeof value === "boolean"
    )
  );
  return Object.keys(safe).length ? safe : undefined;
}

function sanitizeEntry(entry: HistoryEntry): HistoryEntry {
  return {
    id: typeof entry.id === "string" ? entry.id : crypto.randomUUID(),
    timestamp: Number.isFinite(entry.timestamp) ? entry.timestamp : Date.now(),
    toolId: entry.toolId,
    summary: safeSummary(entry.summary, entry.status),
    status: entry.status === "failed" ? "failed" : "success",
    options: safeOptions(entry.options),
  };
}

/** Storage is untrusted even when its schema version is already current. */
export function sanitizeHistoryState(value: unknown): Pick<HistoryState, "entries" | "enabled"> {
  const state = value && typeof value === "object" ? value as Partial<HistoryState> : {};
  const enabled = state.enabled === true;
  const seen = new Set<string>();
  const entries: HistoryEntry[] = [];
  if (enabled && Array.isArray(state.entries)) {
    for (const entry of state.entries) {
      if (!entry || typeof entry !== "object") continue;
      const toolId = typeof entry.toolId === "string" ? resolveToolId(entry.toolId) : null;
      if (!toolId || !Number.isFinite(entry.timestamp) || Math.abs(entry.timestamp) > 8.64e15) continue;
      const clean = sanitizeEntry({
        ...entry,
        toolId,
        summary: typeof entry.summary === "string" ? entry.summary : "completed",
      });
      if (seen.has(clean.id)) continue;
      seen.add(clean.id);
      entries.push(clean);
      if (entries.length === 100) break;
    }
  }
  return { entries, enabled };
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      enabled: false,
      setEnabled: (enabled) => set((s) => ({ enabled, entries: enabled ? s.entries : [] })),
      add: (entry) =>
        set((s) => {
          // Enforce the privacy opt-in here, not just in the `useToolHistory`
          // wrapper hook that currently happens to be the only caller — a
          // future direct `add()` call must not be able to silently bypass
          // "recording is off".
          if (!s.enabled) return s;
          return {
            entries: [
              sanitizeEntry({
                id: crypto.randomUUID(),
                timestamp: entry.timestamp ?? Date.now(),
                toolId: entry.toolId,
                summary: entry.summary,
                status: entry.status,
                options: entry.options,
              }),
              ...s.entries,
            ].slice(0, 100),
          };
        }),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "kit-history",
      version: 2,
      migrate: sanitizeHistoryState,
      partialize: (state) => ({ entries: state.entries, enabled: state.enabled }),
      merge: (persisted, current) => ({ ...current, ...sanitizeHistoryState(persisted) }),
    }
  )
);
