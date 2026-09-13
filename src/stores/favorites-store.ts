"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resolveToolId, type ToolId } from "@/lib/tools/registry";

interface FavoritesState {
  /** May include legacy ids; UI resolves via resolveToolId. */
  ids: Array<ToolId | string>;
  toggle: (id: ToolId) => void;
  isFavorite: (id: ToolId) => boolean;
}

/** The most tools a visitor can keep close at hand. */
export const MAX_FAVORITES = 100;

/**
 * Stored ids are re-checked on load: anything that is not a known tool is
 * dropped, legacy ids resolve to their current tool, repeats collapse, and the
 * list is capped.
 */
export function sanitizeFavoriteIds(value: unknown): Array<ToolId | string> {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ids: Array<ToolId | string> = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const resolved = resolveToolId(entry);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    ids.push(resolved);
    if (ids.length >= MAX_FAVORITES) break;
  }
  return ids;
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
    {
      name: "kit-favorites",
      version: 1,
      migrate: (persisted) => ({
        ids: sanitizeFavoriteIds((persisted as Partial<FavoritesState> | null)?.ids),
      }),
    }
  )
);
