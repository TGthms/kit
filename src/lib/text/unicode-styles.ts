/** Unicode mathematical alphabets contain intentional gaps occupied by older
 * Letterlike Symbols. Never emit those unassigned code points. */
const ASCII = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const range = (start: number, count = 26) =>
  Array.from({ length: count }, (_, i) => String.fromCodePoint(start + i)).join(
    "",
  );
const alphabet = (upper: number, lower: number, digits?: number) =>
  range(upper) + range(lower) + (digits ? range(digits, 10) : "0123456789");
function patched(base: string, replacements: Record<string, string>) {
  const chars = [...base];
  for (const [letter, glyph] of Object.entries(replacements))
    chars[ASCII.indexOf(letter)] = glyph;
  return chars.join("");
}
export const unicodeStyles = {
  bold: alphabet(0x1d400, 0x1d41a, 0x1d7ce),
  italic: patched(alphabet(0x1d434, 0x1d44e), { h: "ℎ" }),
  boldItalic: alphabet(0x1d468, 0x1d482),
  script: patched(alphabet(0x1d49c, 0x1d4b6), {
    B: "ℬ",
    E: "ℰ",
    F: "ℱ",
    H: "ℋ",
    I: "ℐ",
    L: "ℒ",
    M: "ℳ",
    R: "ℛ",
    e: "ℯ",
    g: "ℊ",
    o: "ℴ",
  }),
  boldScript: alphabet(0x1d4d0, 0x1d4ea),
  fraktur: patched(alphabet(0x1d504, 0x1d51e), {
    C: "ℭ",
    H: "ℌ",
    I: "ℑ",
    R: "ℜ",
    Z: "ℨ",
  }),
  doubleStruck: patched(alphabet(0x1d538, 0x1d552, 0x1d7d8), {
    C: "ℂ",
    H: "ℍ",
    N: "ℕ",
    P: "ℙ",
    Q: "ℚ",
    R: "ℝ",
    Z: "ℤ",
  }),
  sans: alphabet(0x1d5a0, 0x1d5ba, 0x1d7e2),
  sansBold: alphabet(0x1d5d4, 0x1d5ee, 0x1d7ec),
  monospace: alphabet(0x1d670, 0x1d68a, 0x1d7f6),
  circled: range(0x24b6) + range(0x24d0) + "⓪①②③④⑤⑥⑦⑧⑨",
  fullwidth: range(0xff21) + range(0xff41) + range(0xff10, 10),
} as const;
export type UnicodeStyle = keyof typeof unicodeStyles;
const styleMaps = Object.fromEntries(
  Object.entries(unicodeStyles).map(([id, glyphs]) => [
    id,
    new Map([...ASCII].map((char, i) => [char, [...glyphs][i]])),
  ]),
) as Record<UnicodeStyle, Map<string, string>>;
const plain = new Map<string, string>();
for (const glyphs of Object.values(unicodeStyles))
  [...glyphs].forEach((glyph, i) => plain.set(glyph, ASCII[i]));

export function plainUnicodeText(text: string): string {
  return [...text].map((char) => plain.get(char) || char).join("");
}
export function styleUnicodeText(text: string, style: UnicodeStyle): string {
  return [...plainUnicodeText(text)]
    .map((char) => styleMaps[style].get(char) || char)
    .join("");
}
