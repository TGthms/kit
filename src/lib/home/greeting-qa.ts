/**
 * Hidden greeting preview. Works in production as well as `next dev`.
 *
 *   /en/?greetingDate=2026-12-25
 *   /zh-Hans/?greetingDate=2026-03-14&greetingSeed=3
 *
 * greetingDate=YYYY-MM-DD — that calendar day. Hour still comes from the real clock
 * (Christmas morning vs afternoon depends on when you load it).
 * greetingSeed=integer — optional. Pins the main/sub pair so refresh does not reshuffle.
 *
 * Invalid values are ignored. Examples: Good Friday 2026 → 2026-04-03.
 * Pi Day → 2026-03-14. Data Privacy Day → 2026-01-28.
 */

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseGreetingDate(value: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const match = DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
  return { year, month, day };
}

export function parseGreetingSeed(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (!/^-?\d+$/.test(value.trim())) return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

/** Keep the wall-clock hour so morning/afternoon still follow now. */
export function overlayGreetingDate(now: Date, override: { year: number; month: number; day: number } | null): Date {
  if (!override) return now;
  return new Date(
    override.year,
    override.month - 1,
    override.day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
}
