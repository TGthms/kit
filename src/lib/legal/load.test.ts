import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n/config";
import { loadLegal, renderSimpleMarkdown } from "./load";

describe("loadLegal", () => {
  it("loads a substantive privacy policy and terms document for every locale", () => {
    for (const locale of locales) {
      const privacy = loadLegal(locale, "privacy");
      const terms = loadLegal(locale, "terms");
      expect(privacy, `${locale} privacy`).toMatch(/^# .{2,}/);
      expect(privacy.length, `${locale} privacy length`).toBeGreaterThan(900);
      expect(privacy).toContain("[contact.timg@icloud.com](mailto:contact.timg@icloud.com)");
      expect(terms, `${locale} terms`).toMatch(/^# .{2,}/);
      expect(terms.length, `${locale} terms length`).toBeGreaterThan(900);
      expect(terms).toContain("[contact.timg@icloud.com](mailto:contact.timg@icloud.com)");
    }
  });

  it("renders the email contact link as an anchor", () => {
    const html = renderSimpleMarkdown("Contact: [contact.timg@icloud.com](mailto:contact.timg@icloud.com)");
    expect(html).toContain('href="mailto:contact.timg@icloud.com"');
    expect(html).toContain(">contact.timg@icloud.com</a>");
  });
});
