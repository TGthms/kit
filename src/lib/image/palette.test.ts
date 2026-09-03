import { describe, expect, it } from "vitest";
import { extractPalette } from "./palette";

function rgba(...pixels: Array<[number, number, number, number?]>): Uint8ClampedArray {
  const data = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b, a = 255], index) => {
    const offset = index * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
  });
  return data;
}

describe("extractPalette", () => {
  it("quantizes colors and sorts by count", () => {
    const data = rgba(
      [10, 20, 30],
      [15, 25, 31],
      [200, 100, 50],
      [200, 100, 50],
      [200, 100, 50],
      [0, 0, 0, 0],
    );
    const palette = extractPalette({ data, width: 3, height: 2 }, { maxColors: 3 });
    expect(palette[0]).toEqual({ hex: "#c06030", count: 3 });
    expect(palette[1]).toEqual({ hex: "#001010", count: 2 });
    expect(palette).toHaveLength(2);
  });

  it("respects maxColors and validates input", () => {
    const data = rgba([0, 0, 0], [16, 0, 0], [32, 0, 0], [48, 0, 0]);
    expect(extractPalette({ data, width: 2, height: 2 }, { maxColors: 2 })).toHaveLength(2);
    expect(() => extractPalette({ data, width: 2, height: 2 }, { maxColors: 0 })).toThrow(RangeError);
    expect(() => extractPalette({ data: new Uint8Array(4), width: 2, height: 2 })).toThrow(RangeError);
  });
});
