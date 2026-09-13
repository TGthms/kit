export type TimestampParse =
  | { ok: true; ms: number; iso: string; unix: number; utc: string; local: string }
  | { ok: false; error: string };

export function nowTimestamp(): { ms: number; unix: number; iso: string } {
  const ms = Date.now();
  return { ms, unix: Math.floor(ms / 1000), iso: new Date(ms).toISOString() };
}

/** Number of integer digits, ignoring a sign and any fractional part. */
function integerDigitCount(value: string): number {
  return value.replace(/^-/, "").split(".")[0].length;
}

/**
 * Convert a numeric Unix time to milliseconds, reading the unit from how many
 * digits the value has. A magnitude threshold cannot separate seconds from
 * milliseconds, because the two ranges overlap for every date before 2001.
 */
function toMilliseconds(value: number, digits: number): number {
  if (digits <= 10) return Math.round(value * 1000);
  if (digits <= 13) return Math.round(value);
  if (digits <= 16) return Math.round(value / 1000);
  return Math.round(value / 1e6);
}

export function parseTimestamp(input: string): TimestampParse {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Empty value" };

  let ms: number;
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    ms = toMilliseconds(Number(raw), integerDigitCount(raw));
  } else {
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) return { ok: false, error: "Not a Unix time or date string" };
    ms = parsed;
  }
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid date" };
  return {
    ok: true,
    ms,
    unix: Math.floor(ms / 1000),
    iso: d.toISOString(),
    utc: d.toUTCString(),
    local: d.toString(),
  };
}
