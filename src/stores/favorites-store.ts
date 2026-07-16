"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToolId } from "@/lib/tools/registry";

interface FavoritesState {
  ids: ToolId[];
  toggle: (id: ToolId) => void;
  isFavorite: (id: ToolId) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      isFavorite: (id) => get().ids.includes(id),
    }),
    { name: "kit-favorites" }
  )
);
