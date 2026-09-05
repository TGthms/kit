/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { homeHref, parseCategoryParam, parseCategoryPath, rewriteCategoryQuery } from "./routes";

describe("category routes", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("uses /c/{category}/ as the public category URL", () => {
    expect(homeHref()).toBe("/");
    expect(homeHref("pdf")).toBe("/c/pdf/");
    expect(parseCategoryParam("pdf")).toBe("pdf");
    expect(parseCategoryParam("nope")).toBeNull();
    expect(parseCategoryPath("/c/pdf/")).toBe("pdf");
    expect(parseCategoryPath("/c/pdf")).toBe("pdf");
    expect(parseCategoryPath("/")).toBeNull();
  });

  it("rewrites ?c= onto /c/{category}/ and keeps other query", () => {
    window.history.replaceState(null, "", "/en/?c=pdf&date=2026-12-25");
    rewriteCategoryQuery();
    expect(`${window.location.pathname}${window.location.search}`).toBe("/en/c/pdf/?date=2026-12-25");
  });
});
