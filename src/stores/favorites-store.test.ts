// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { sanitizeFavoriteIds } from "./favorites-store";

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
