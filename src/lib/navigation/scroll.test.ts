import { describe, expect, it } from "vitest";
import { scrollKeyFromLocation, scrollKeyFromUrl } from "./scroll";

describe("scroll keys", () => {
  it("drops trailing slashes and hashes", () => {
    expect(scrollKeyFromUrl("https://trykit.pages.dev/en/tools/pdf-merge/")).toBe("/en/tools/pdf-merge");
    expect(scrollKeyFromUrl("/en/?c=pdf", "https://trykit.pages.dev")).toBe("/en?c=pdf");
    expect(scrollKeyFromUrl("/en/#top", "https://trykit.pages.dev")).toBe("/en");
  });

  it("keeps search on the current location", () => {
    expect(scrollKeyFromLocation({ pathname: "/en/", search: "?from=%2F" })).toBe("/en?from=%2F");
  });
});
