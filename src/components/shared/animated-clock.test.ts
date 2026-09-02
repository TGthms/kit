import { describe, expect, it } from "vitest";
import { clockFace } from "./clock-face";

describe("clockFace", () => {
  it("pads a two-digit mm:ss when hours are omitted", () => {
    expect(clockFace(undefined, 3, 9)).toBe("03:09");
  });

  it("pads HH:MM:SS so Scritto can keep the colons still", () => {
    expect(clockFace(1, 0, 5)).toBe("01:00:05");
    expect(clockFace(0, 59, 0)).toBe("00:59:00");
  });
});
