export type PixelBuffer = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export type RotateDegrees = 90 | 180 | 270;
export type FlipAxis = "h" | "v";
export type FilterName = "none" | "grayscale" | "sepia" | "invert";

function at(buf: PixelBuffer, x: number, y: number): [number, number, number, number] {
  const i = (y * buf.width + x) * 4;
  return [buf.data[i], buf.data[i + 1], buf.data[i + 2], buf.data[i + 3]];
}

function set(buf: PixelBuffer, x: number, y: number, px: [number, number, number, number]) {
  const i = (y * buf.width + x) * 4;
  buf.data[i] = px[0];
  buf.data[i + 1] = px[1];
  buf.data[i + 2] = px[2];
  buf.data[i + 3] = px[3];
}

export function rotatePixels(buf: PixelBuffer, degrees: RotateDegrees): PixelBuffer {
  if (degrees === 180) {
    const out: PixelBuffer = {
      data: new Uint8ClampedArray(buf.data.length),
      width: buf.width,
      height: buf.height,
    };
    for (let y = 0; y < buf.height; y++) {
      for (let x = 0; x < buf.width; x++) {
        set(out, buf.width - 1 - x, buf.height - 1 - y, at(buf, x, y));
      }
    }
    return out;
  }
  const out: PixelBuffer = {
    data: new Uint8ClampedArray(buf.data.length),
    width: buf.height,
    height: buf.width,
  };
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      if (degrees === 90) set(out, buf.height - 1 - y, x, at(buf, x, y));
      else set(out, y, buf.width - 1 - x, at(buf, x, y));
    }
  }
  return out;
}

export function flipPixels(buf: PixelBuffer, axis: FlipAxis): PixelBuffer {
  const out: PixelBuffer = {
    data: new Uint8ClampedArray(buf.data.length),
    width: buf.width,
    height: buf.height,
  };
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      const nx = axis === "h" ? buf.width - 1 - x : x;
      const ny = axis === "v" ? buf.height - 1 - y : y;
      set(out, nx, ny, at(buf, x, y));
    }
  }
  return out;
}

export function applyFilterPixels(buf: PixelBuffer, filter: FilterName): PixelBuffer {
  if (filter === "none") {
    return { data: new Uint8ClampedArray(buf.data), width: buf.width, height: buf.height };
  }
  const out: PixelBuffer = {
    data: new Uint8ClampedArray(buf.data.length),
    width: buf.width,
    height: buf.height,
  };
  for (let i = 0; i < buf.data.length; i += 4) {
    const r = buf.data[i];
    const g = buf.data[i + 1];
    const b = buf.data[i + 2];
    const a = buf.data[i + 3];
    if (filter === "grayscale") {
      const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      out.data[i] = y;
      out.data[i + 1] = y;
      out.data[i + 2] = y;
    } else if (filter === "sepia") {
      out.data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
      out.data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
      out.data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    } else {
      out.data[i] = 255 - r;
      out.data[i + 1] = 255 - g;
      out.data[i + 2] = 255 - b;
    }
    out.data[i + 3] = a;
  }
  return out;
}

export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;
