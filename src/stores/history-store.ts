"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToolId } from "@/lib/tools/registry";

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

function safeSummary(summary: string, status: HistoryEntry["status"]): string {
  if (status === "failed" || /fail|error|cancel/i.test(summary)) return "failed";
  const normalized = summary.trim();
  // Keep only compact, non-user-controlled operation metadata. Free-form
  // filenames, watermark text, ranges, and pasted input become "completed".
  if (/^(?:completed|success)$/i.test(normalized)) return "completed";
  if (/^\d+(?:\.\d+)?(?: (?:files|images|pages|sizes))?$/i.test(normalized)) return normalized.slice(0, 32);
  if (/^(?:q|speed|count|n)=\d+(?:\.\d+)?(?: (?:q|speed|count|n)=\d+(?:\.\d+)?)*$/i.test(normalized)) {
    return normalized.slice(0, 48);
  }
  return "completed";
}

function safeOptions(options: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!options) return undefined;
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

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
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
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<HistoryState>;
        return {
          entries: Array.isArray(state.entries)
            ? state.entries.filter(Boolean).map((entry) => sanitizeEntry(entry as HistoryEntry)).slice(0, 100)
            : [],
          enabled: state.enabled === true,
        };
      },
    }
  )
);
