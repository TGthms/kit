"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToolId } from "@/lib/tools/registry";

export interface ToolPreset {
  id: string;
  toolId: ToolId;
  name: string;
  options: Record<string, unknown>;
}

interface PresetsState {
  presets: ToolPreset[];
  add: (preset: Omit<ToolPreset, "id">) => void;
  remove: (id: string) => void;
  forTool: (toolId: ToolId) => ToolPreset[];
}

export const usePresetsStore = create<PresetsState>()(
  persist(
    (set, get) => ({
      presets: [],
      add: (preset) =>
        set((s) => ({
          presets: [
            ...s.presets,
            { ...preset, id: crypto.randomUUID() },
          ].slice(-50),
        })),
      remove: (id) => set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
      forTool: (toolId) => get().presets.filter((p) => p.toolId === toolId),
    }),
    { name: "kit-presets" }
  )
);
