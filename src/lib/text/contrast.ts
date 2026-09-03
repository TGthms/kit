export type Rgb = { r: number; g: number; b: number };
export type WcagLevel = "fail" | "AA" | "AAA";

/** Parse `#rgb` or `#rrggbb` (optional leading #). */
export function parseHex(hex: string): Rgb {
  const s = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s)) throw new RangeError("Invalid hex color.");
  const full =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function channelLuminance(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance for an sRGB color. */
export function relativeLuminance(rgb: Rgb): number {
  const { r, g, b } = rgb;
  if (![r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
    throw new RangeError("RGB channels must be finite numbers from 0 to 255.");
  }
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG 2.x contrast ratio between two hex colors. */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(parseHex(hexA));
  const l2 = relativeLuminance(parseHex(hexB));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Normal-text WCAG level: AAA ≥ 7, AA ≥ 4.5, else fail. */
export function wcagLevel(ratio: number): WcagLevel {
  if (!Number.isFinite(ratio) || ratio < 0) throw new RangeError("ratio must be a non-negative finite number.");
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}
