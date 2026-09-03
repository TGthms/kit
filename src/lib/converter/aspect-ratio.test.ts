import { describe, expect, it } from "vitest";
import { missingSide, parseRatio, ratioFromSize } from "./aspect-ratio";

describe("aspect ratio helpers", () => {
  it("reduces sizes by gcd", () => {
    expect(ratioFromSize(1920, 1080)).toEqual({ w: 16, h: 9 });
    expect(ratioFromSize(800, 600)).toEqual({ w: 4, h: 3 });
  });

  it("fills in the missing side", () => {
    expect(missingSide({ width: 1920, ratioW: 16, ratioH: 9 })).toEqual({ width: 1920, height: 1080 });
    expect(missingSide({ height: 1080, ratioW: 16, ratioH: 9 })).toEqual({ width: 1920, height: 1080 });
    expect(() => missingSide({ ratioW: 16, ratioH: 9 })).toThrow(RangeError);
    expect(() => missingSide({ width: 1, height: 1, ratioW: 16, ratioH: 9 })).toThrow(RangeError);
  });

  it("parses ratio strings", () => {
    expect(parseRatio("16:9")).toEqual({ w: 16, h: 9 });
    expect(parseRatio("4 / 3")).toEqual({ w: 4, h: 3 });
    expect(() => parseRatio("wide")).toThrow(RangeError);
  });
});
