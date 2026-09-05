import { describe, expect, it } from "vitest";
import { SITE_URL } from "./site";
import { stripShareQuery, toolShareUrl } from "./share";

describe("tool share URL", () => {
  it("uses the canonical host and drops nav query", () => {
    expect(toolShareUrl("en", "pdf-merge")).toBe(`${SITE_URL}/en/tools/pdf-merge/`);
    expect(toolShareUrl("zh", "timezone-converter")).toBe(`${SITE_URL}/zh-Hans/tools/world-clock/`);
    expect(toolShareUrl("en", "pdf-merge")).not.toContain("from=");
  });

  it("strips from= from an otherwise valid tool URL", () => {
    const dirty = `${SITE_URL}/en/tools/pdf-merge/?from=%2F%3Fc%3Dpdf`;
    expect(stripShareQuery(dirty)).toBe(`${SITE_URL}/en/tools/pdf-merge/`);
  });
});
