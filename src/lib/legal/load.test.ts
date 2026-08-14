import { describe, expect, it } from "vitest";
import { loadLegal } from "./load";

describe("loadLegal", () => {
  it("returns English markdown when a locale has no unique legal file", () => {
    const privacy = loadLegal("fr", "privacy");
    const terms = loadLegal("ar", "terms");
    expect(privacy).toContain("Privacy");
    expect(terms.length).toBeGreaterThan(40);
    const hans = loadLegal("zh-Hans", "privacy");
    expect(hans.length).toBeGreaterThan(40);
  });
});
