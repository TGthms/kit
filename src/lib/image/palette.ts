export type ImageDataLike = {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
};

export type PaletteColor = {
  hex: string;
  count: number;
};

export type ExtractPaletteOptions = {
  maxColors?: number;
};

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Quantize to 4-bit/channel buckets and return top colors by pixel count. */
export function extractPalette(imageData: ImageDataLike, options: ExtractPaletteOptions = {}): PaletteColor[] {
  const { maxColors = 6 } = options;
  if (!Number.isInteger(maxColors) || maxColors < 1) throw new RangeError("maxColors must be a positive integer.");
  const { data, width, height } = imageData;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0) {
    throw new RangeError("width and height must be non-negative integers.");
  }
  const expected = width * height * 4;
  if (data.length < expected) throw new RangeError("image data is shorter than width*height*4.");

  const counts = new Map<number, number>();
  const pixels = width * height;
  for (let i = 0; i < pixels; i += 1) {
    const offset = i * 4;
    const a = data[offset + 3] ?? 255;
    if (a === 0) continue;
    const r = data[offset] & 0xf0;
    const g = data[offset + 1] & 0xf0;
    const b = data[offset + 2] & 0xf0;
    const key = (r << 16) | (g << 8) | b;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, maxColors)
    .map(([key, count]) => ({
      hex: toHex((key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff),
      count,
    }));
}
