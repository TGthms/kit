// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHUNK_RELOAD_GUARD_MS,
  CHUNK_RELOAD_KEY,
  isChunkLoadError,
  reloadForStaleChunk,
  shouldReloadForChunkError,
} from "./chunk-load";

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, "getItem" | "setItem"> {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("isChunkLoadError", () => {
  it("matches webpack and native dynamic-import failures", () => {
    expect(isChunkLoadError({ name: "ChunkLoadError", message: "Loading chunk 123 failed." })).toBe(true);
    expect(isChunkLoadError(new Error("Failed to fetch dynamically imported module: /_next/static/chunks/foo.js"))).toBe(true);
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
    expect(isChunkLoadError("error loading dynamically imported module")).toBe(true);
  });

  it("ignores ordinary failures", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError(new TypeError("Cannot read properties of null"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError("")).toBe(false);
  });
});

describe("shouldReloadForChunkError", () => {
  it("allows the first reload and blocks a second inside the guard window", () => {
    const storage = memoryStorage();
    expect(shouldReloadForChunkError(1_000, storage)).toBe(true);
    expect(storage.getItem(CHUNK_RELOAD_KEY)).toBe("1000");
    expect(shouldReloadForChunkError(1_000 + CHUNK_RELOAD_GUARD_MS - 1, storage)).toBe(false);
    expect(shouldReloadForChunkError(1_000 + CHUNK_RELOAD_GUARD_MS, storage)).toBe(true);
  });

  it("reloads when storage is missing", () => {
    expect(shouldReloadForChunkError(1, null)).toBe(true);
  });
});

describe("reloadForStaleChunk", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubLocation(href: string) {
    const replace = vi.fn();
    const reload = vi.fn();
    vi.stubGlobal("location", { href, replace, reload });
    return { replace, reload };
  }

  it("replaces the location with a cache-bust query instead of reload", () => {
    const { replace, reload } = stubLocation("https://trykit.pages.dev/en/tools/pdf-merge/?x=1");
    expect(reloadForStaleChunk()).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
    const dest = String(replace.mock.calls[0]?.[0] ?? "");
    expect(dest).toContain("/en/tools/pdf-merge/");
    expect(dest).toContain("x=1");
    expect(dest).toMatch(/[?&]_kitcb=\d+/);
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeTruthy();
  });

  it("honors the 10s sessionStorage guard", () => {
    const { replace } = stubLocation("https://trykit.pages.dev/en/");
    expect(reloadForStaleChunk()).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(reloadForStaleChunk()).toBe(false);
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
