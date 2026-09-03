export type Ratio = { w: number; h: number };

export type MissingSideInput = {
  width?: number;
  height?: number;
  ratioW: number;
  ratioH: number;
};

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number.`);
}

function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be positive.`);
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Reduce width/height to lowest terms via gcd. */
export function ratioFromSize(w: number, h: number): Ratio {
  assertPositive(w, "w");
  assertPositive(h, "h");
  const rw = Math.round(w);
  const rh = Math.round(h);
  if (rw <= 0 || rh <= 0) throw new RangeError("w and h must round to positive integers.");
  const d = gcd(rw, rh);
  return { w: rw / d, h: rh / d };
}

/** Compute the missing side from a ratio and one known dimension. */
export function missingSide({ width, height, ratioW, ratioH }: MissingSideInput): { width: number; height: number } {
  assertPositive(ratioW, "ratioW");
  assertPositive(ratioH, "ratioH");
  const hasW = width !== undefined;
  const hasH = height !== undefined;
  if (hasW === hasH) throw new RangeError("Provide exactly one of width or height.");
  if (hasW) {
    assertPositive(width!, "width");
    return { width: width!, height: (width! * ratioH) / ratioW };
  }
  assertPositive(height!, "height");
  return { width: (height! * ratioW) / ratioH, height: height! };
}

/** Parse `"16:9"` / `"16/9"` into a reduced ratio. */
export function parseRatio(text: string): Ratio {
  const match = /^\s*(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)\s*$/.exec(text);
  if (!match) throw new RangeError('Ratio must look like "16:9".');
  const w = Number(match[1]);
  const h = Number(match[2]);
  return ratioFromSize(w, h);
}
