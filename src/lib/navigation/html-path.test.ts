import { describe, expect, it } from "vitest";
import { htmlHref, htmlPathname, isRscDocumentPath } from "./html-path";

describe("RSC document paths", () => {
  it("detects Next static payload URLs", () => {
    expect(isRscDocumentPath("/en/tools/random-generator/index.txt")).toBe(true);
    expect(isRscDocumentPath("/en/tools/random-generator/")).toBe(false);
  });

  it("maps payload URLs back to the HTML page", () => {
    expect(htmlPathname("/en/tools/random-generator/index.txt")).toBe("/en/tools/random-generator/");
    expect(htmlHref("https://trykit.pages.dev/en/tools/video-gif/index.txt?from=%2F")).toBe(
      "/en/tools/video-gif/?from=%2F"
    );
  });
});
