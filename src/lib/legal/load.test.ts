import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n/config";
import { loadLegal } from "./load";

describe("loadLegal", () => {
  it("loads a substantive privacy policy and terms document for every locale", () => {
    for (const locale of locales) {
      expect(loadLegal(locale, "privacy"), `${locale} privacy`).toMatch(/^# .{2,}/);
      expect(loadLegal(locale, "privacy").length, `${locale} privacy length`).toBeGreaterThan(900);
      expect(loadLegal(locale, "terms"), `${locale} terms`).toMatch(/^# .{2,}/);
      expect(loadLegal(locale, "terms").length, `${locale} terms length`).toBeGreaterThan(900);
    }
  });
});
