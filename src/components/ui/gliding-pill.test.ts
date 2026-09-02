import { describe, expect, it } from "vitest";
import { measurePill } from "./gliding-pill";

describe("measurePill", () => {
  it("returns the target box relative to the container", () => {
    const container = {
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 40 }),
    } as HTMLElement;
    const target = {
      getBoundingClientRect: () => ({ left: 50, top: 24, width: 32, height: 32 }),
    } as HTMLElement;
    expect(measurePill(container, target)).toEqual({
      left: 40,
      top: 4,
      width: 32,
      height: 32,
    });
  });
});
