export type CheckResult = {
  ok: boolean;
  normalized?: string;
};

/** Strip spaces and hyphens. */
export function normalizeDigits(s: string): string {
  return s.replace(/[\s-]+/g, "");
}

function onlyDigits(s: string): boolean {
  return /^\d+$/.test(s);
}

/** ISBN-13 check digit (also used by EAN-13). */
export function isbn13Check(input: string): CheckResult {
  const normalized = normalizeDigits(input);
  if (!onlyDigits(normalized) || normalized.length !== 13) return { ok: false, normalized };
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const digit = Number(normalized[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return { ok: check === Number(normalized[12]), normalized };
}

/** ISBN-10 check digit (X allowed as check). */
export function isbn10Check(input: string): CheckResult {
  const normalized = normalizeDigits(input).toUpperCase();
  if (!/^\d{9}[\dX]$/.test(normalized)) return { ok: false, normalized };
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(normalized[i]) * (10 - i);
  const checkValue = normalized[9] === "X" ? 10 : Number(normalized[9]);
  sum += checkValue;
  return { ok: sum % 11 === 0, normalized };
}

/** EAN-13 uses the same algorithm as ISBN-13. */
export function ean13Check(input: string): CheckResult {
  return isbn13Check(input);
}

function ibanToDigits(iban: string): string {
  let out = "";
  for (const ch of iban) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch >= "A" && ch <= "Z") out += String(ch.charCodeAt(0) - 55);
    else return "";
  }
  return out;
}

/** IBAN: rearrange, A=10..Z=35, mod 97 === 1. */
export function ibanCheck(input: string): CheckResult {
  const normalized = normalizeDigits(input).toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(normalized) || normalized.length < 15 || normalized.length > 34) {
    return { ok: false, normalized };
  }
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  const digits = ibanToDigits(rearranged);
  if (!digits) return { ok: false, normalized };

  let remainder = 0;
  for (const ch of digits) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return { ok: remainder === 1, normalized };
}
