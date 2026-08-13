export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };
export type Hsv = { h: number; s: number; v: number };

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n));
}

export function parseHex(hex: string): Rgb | null {
  const s = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s)) return null;
  const full =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hueToRgb(p: number, q: number, t: number) {
  let T = t;
  if (T < 0) T += 1;
  if (T > 1) T -= 1;
  if (T < 1 / 6) return p + (q - p) * 6 * T;
  if (T < 1 / 2) return q;
  if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
  return p;
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const H = ((h % 360) + 360) % 360 / 360;
  const S = s / 100;
  const L = l / 100;
  if (S === 0) {
    const v = Math.round(L * 255);
    return { r: v, g: v, b: v };
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  return {
    r: Math.round(hueToRgb(p, q, H + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, H) * 255),
    b: Math.round(hueToRgb(p, q, H - 1 / 3) * 255),
  };
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const S = s / 100;
  const V = v / 100;
  const C = V * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = V - C;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [C, X, 0];
  else if (h < 120) [rp, gp, bp] = [X, C, 0];
  else if (h < 180) [rp, gp, bp] = [0, C, X];
  else if (h < 240) [rp, gp, bp] = [0, X, C];
  else if (h < 300) [rp, gp, bp] = [X, 0, C];
  else [rp, gp, bp] = [C, 0, X];
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function convertColor(input: string): {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  hsv: Hsv;
  cssRgb: string;
  cssHsl: string;
} | null {
  const hex = parseHex(input);
  if (!hex) return null;
  const hsl = rgbToHsl(hex);
  const hsv = rgbToHsv(hex);
  return {
    hex: rgbToHex(hex),
    rgb: hex,
    hsl,
    hsv,
    cssRgb: `rgb(${hex.r}, ${hex.g}, ${hex.b})`,
    cssHsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
  };
}
