import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import { APP_PAGE_SEGMENTS } from "../../../scripts/sw-precache.mjs";
import { APP_PAGES, APP_PAGE_IDS, isAppPageId } from "./app-pages";

function lookup(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined),
      source
    );
}

describe("the app's own pages", () => {
  it("are the ids the manifest groups a language's pages under", () => {
    /* The page asks for these ids; the worker looks each one up in the manifest.
       If the two drift, a page is either offered and never fetched, or fetched
       and never offered — and neither shows up as a failure anywhere else. */
    expect(APP_PAGE_IDS).toEqual([...APP_PAGE_SEGMENTS.map(([id]) => id), "categories"]);
  });

  it("each name a catalog string that exists, and no two the same", () => {
    for (const page of APP_PAGES) {
      expect(typeof lookup(en, page.label), `${page.id} -> ${page.label}`).toBe("string");
    }
    const labels = APP_PAGES.map((page) => page.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("recognises its own ids and nothing else", () => {
    expect(isAppPageId("history")).toBe(true);
    expect(isAppPageId("gone")).toBe(false);
    expect(isAppPageId(undefined)).toBe(false);
    expect(isAppPageId(7)).toBe(false);
  });
});
