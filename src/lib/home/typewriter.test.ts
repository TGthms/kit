import { describe, expect, it } from "vitest";
import { segmentGraphemes, typewriterIntervalMs } from "./typewriter";

describe("greeting typewriter", () => {
  it("splits by grapheme so CJK and combining marks stay intact", () => {
    expect(segmentGraphemes("Hi")).toEqual(["H", "i"]);
    expect(segmentGraphemes("早上好")).toEqual(["早", "上", "好"]);
    expect(segmentGraphemes("")).toEqual([]);
  });

  it("caps long lines so observances do not type for several seconds", () => {
    expect(typewriterIntervalMs(1)).toBe(0);
    const short = typewriterIntervalMs(12);
    const long = typewriterIntervalMs(120);
    expect(short * 12).toBeGreaterThanOrEqual(380);
    expect(long * 120).toBeLessThanOrEqual(1400);
    expect(long * 120).toBeLessThan(short * 12 * 4);
  });
});
