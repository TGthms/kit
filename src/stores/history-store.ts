"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToolId } from "@/lib/tools/registry";

export interface HistoryEntry {
  id: string;
  toolId: ToolId;
  timestamp: number;
  summary: string;
  status: "success" | "failed";
  options?: Record<string, unknown>;
}

interface HistoryState {
  entries: HistoryEntry[];
  add: (entry: Omit<HistoryEntry, "id" | "timestamp"> & { timestamp?: number }) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((s) => ({
          entries: [
            {
              id: crypto.randomUUID(),
              timestamp: entry.timestamp ?? Date.now(),
              toolId: entry.toolId,
              summary: entry.summary,
              status: entry.status,
              options: entry.options,
            },
            ...s.entries,
          ].slice(0, 100),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "kit-history" }
  )
);
