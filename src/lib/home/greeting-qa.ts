/**
 * Hidden greeting preview. Works in production as well as `next dev`.
 *
 *   /en/?date=2026-12-25
 *   /zh-Hans/?date=2026-03-14&greetingSeed=3
 *   /en/?date=2026-12-31&time=23:59:03
 *
 * date=YYYY-MM-DD (alias: greetingDate) — that calendar day.
 * time=HH:MM or HH:MM:SS (alias: greetingTime) — optional clock on that day.
 *   If omitted, the real wall-clock hour/minute/second is kept.
 *   If set, preview time starts there and advances with the real clock
 *   so a New Year flip can be watched without waiting for midnight.
 * greetingSeed=integer — optional. Pins the main/sub pair so refresh does not reshuffle.
 *
 * Invalid values are ignored. Examples: Good Friday 2026 → 2026-04-03.
 * Pi Day → 2026-03-14. Data Privacy Day → 2026-01-28.
 */

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export type GreetingDateOverride = { year: number; month: number; day: number };
export type GreetingTimeOverride = { hours: number; minutes: number; seconds: number };

export function parseGreetingDate(value: string | null | undefined): GreetingDateOverride | null {
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

export function parseGreetingTime(value: string | null | undefined): GreetingTimeOverride | null {
  if (!value) return null;
  const match = TIME.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] == null || match[3] === "" ? 0 : Number(match[3]);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
}

export function parseGreetingSeed(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (!/^-?\d+$/.test(value.trim())) return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

/** Keep the wall-clock hour so morning/afternoon still follow now, unless time is set. */
export function overlayGreetingDate(
  now: Date,
  dateOverride: GreetingDateOverride | null,
  timeOverride: GreetingTimeOverride | null = null,
): Date {
  if (!dateOverride && !timeOverride) return now;
  return new Date(
    dateOverride?.year ?? now.getFullYear(),
    dateOverride ? dateOverride.month - 1 : now.getMonth(),
    dateOverride?.day ?? now.getDate(),
    timeOverride?.hours ?? now.getHours(),
    timeOverride?.minutes ?? now.getMinutes(),
    timeOverride?.seconds ?? now.getSeconds(),
    timeOverride ? 0 : now.getMilliseconds(),
  );
}

/**
 * Date-only preview tracks the live clock on the chosen day.
 * A time preview starts at that instant and then advances, so countdowns can finish.
 */
export function virtualGreetingNow(
  wallNow: Date,
  dateOverride: GreetingDateOverride | null,
  timeOverride: GreetingTimeOverride | null,
  origin: { wallMs: number; nowMs: number } | null = null,
): Date {
  const overlaid = overlayGreetingDate(wallNow, dateOverride, timeOverride);
  if (!timeOverride || !origin) return overlaid;
  return new Date(overlaid.getTime() + Math.max(0, origin.nowMs - origin.wallMs));
}
