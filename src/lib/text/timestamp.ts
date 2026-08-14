export type TimestampParse =
  | { ok: true; ms: number; iso: string; unix: number; utc: string; local: string }
  | { ok: false; error: string };

export function nowTimestamp(): { ms: number; unix: number; iso: string } {
  const ms = Date.now();
  return { ms, unix: Math.floor(ms / 1000), iso: new Date(ms).toISOString() };
}

export function parseTimestamp(input: string): TimestampParse {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Empty value" };

  let ms: number;
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    ms = Math.abs(n) < 1e12 ? Math.round(n * 1000) : Math.round(n);
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
