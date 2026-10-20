// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { sanitizeFavoriteIds, useFavoritesStore } from "./favorites-store";

afterEach(() => { useFavoritesStore.setState({ ids: [] }); localStorage.clear(); });

describe("favorites hydration", () => {
  it.each([null, { ids: null }, { ids: "pdf-merge" }, { ids: [null, 3, "unknown"] }])("recovers malformed current-version data: %j", async (state) => {
    localStorage.setItem("kit-favorites", JSON.stringify({ version: 1, state }));
    await useFavoritesStore.persist.rehydrate();
    expect(useFavoritesStore.getState().ids).toEqual([]);
    useFavoritesStore.getState().toggle("pdf-merge");
    expect(useFavoritesStore.getState().isFavorite("pdf-merge")).toBe(true);
  });

  it.each([0, 1])("sanitizes version %s without replacing actions", async (version) => {
    localStorage.setItem("kit-favorites", JSON.stringify({ version, state: { ids: ["media-convert", "video-convert", "pdf-merge"], toggle: null } }));
    await useFavoritesStore.persist.rehydrate();
    expect(useFavoritesStore.getState().ids).toEqual(["video-convert", "pdf-merge"]);
    expect(typeof useFavoritesStore.getState().toggle).toBe("function");
  });
});

describe("sanitizeFavoriteIds", () => {
  it("keeps known tools and resolves legacy ids", () => {
    expect(sanitizeFavoriteIds(["pdf-merge", "media-convert", "currency-converter"])).toEqual([
      "pdf-merge",
      "video-convert",
      "currency-converter",
    ]);
  });

  it("drops anything that is not a tool and collapses repeats", () => {
    expect(sanitizeFavoriteIds(["pdf-merge", "pdf-merge", "not-a-tool", 42, null, {}])).toEqual(["pdf-merge"]);
  });

  it("survives a stored value that is not a list", () => {
    expect(sanitizeFavoriteIds("pdf-merge")).toEqual([]);
    expect(sanitizeFavoriteIds(undefined)).toEqual([]);
    expect(sanitizeFavoriteIds(null)).toEqual([]);
  });
});
