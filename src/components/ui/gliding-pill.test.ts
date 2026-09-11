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

  it("reports the box against the padding box, not the border box", () => {
    // `left`/`top` on the pill resolve against the container's padding box, so a
    // bordered container must have its border width subtracted.
    const container = {
      clientLeft: 1,
      clientTop: 1,
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 40 }),
    } as unknown as HTMLElement;
    const target = {
      getBoundingClientRect: () => ({ left: 50, top: 24, width: 32, height: 32 }),
    } as unknown as HTMLElement;
    expect(measurePill(container, target)).toEqual({
      left: 39,
      top: 3,
      width: 32,
      height: 32,
    });
  });
});
