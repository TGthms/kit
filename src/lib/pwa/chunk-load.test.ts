import { describe, expect, it } from "vitest";
import {
  CHUNK_RELOAD_GUARD_MS,
  CHUNK_RELOAD_KEY,
  isChunkLoadError,
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
