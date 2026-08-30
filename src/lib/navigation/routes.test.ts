import { describe, expect, it } from "vitest";
import { toolHref, toolPathSegment } from "./routes";

describe("tool paths", () => {
  it("uses world-clock as the public segment for timezone-converter", () => {
    expect(toolPathSegment("timezone-converter")).toBe("world-clock");
    expect(toolHref("timezone-converter", "/favorites")).toBe(
      "/tools/world-clock?from=%2Ffavorites"
    );
  });

  it("keeps other tool ids as the URL segment", () => {
    expect(toolPathSegment("pdf-merge")).toBe("pdf-merge");
  });
});
