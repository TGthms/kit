const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function parseBaseInt(input: string, fromBase: number): { ok: true; value: bigint } | { ok: false; error: string } {
  if (fromBase < 2 || fromBase > 36) return { ok: false, error: "Base must be 2–36" };
  let raw = input.trim().toLowerCase();
  if (fromBase === 16) raw = raw.replace(/^0x/, "");
  if (fromBase === 2) raw = raw.replace(/^0b/, "");
  if (!raw) return { ok: false, error: "Empty number" };
  let value = BigInt(0);
  for (const ch of raw) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= fromBase) return { ok: false, error: `Invalid digit '${ch}' for base ${fromBase}` };
    value = value * BigInt(fromBase) + BigInt(d);
  }
  return { ok: true, value };
}

export function formatBaseInt(value: bigint, toBase: number): string {
  if (toBase < 2 || toBase > 36) throw new Error("Base must be 2–36");
  if (value === BigInt(0)) return "0";
  const neg = value < BigInt(0);
  let n = neg ? -value : value;
  let out = "";
  const b = BigInt(toBase);
  while (n > BigInt(0)) {
    const d = Number(n % b);
    out = DIGITS[d] + out;
    n = n / b;
  }
  return neg ? `-${out}` : out;
}

export function convertBase(
  input: string,
  fromBase: number,
  toBase: number
): { ok: true; value: string; decimal: string } | { ok: false; error: string } {
  const parsed = parseBaseInt(input, fromBase);
  if (!parsed.ok) return parsed;
  try {
    return {
      ok: true,
      value: formatBaseInt(parsed.value, toBase),
      decimal: parsed.value.toString(10),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
