import { getTimeZoneParts, isValidTimeZone } from "./timezone";

export type OverlapWindowsInput = {
  zones: string[];
  date: string;
  startHour: number;
  endHour: number;
  workStart?: number;
  workEnd?: number;
};

export type OverlapWindow = {
  utcHour: number;
  utcIso: string;
  localHours: Record<string, number>;
};

function assertHour(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 23) {
    throw new RangeError(`${name} must be an integer from 0 to 23.`);
  }
}

function assertWorkBound(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 24) {
    throw new RangeError(`${name} must be an integer from 0 to 24.`);
  }
}

function localIsoDate(parts: { year: number; month: number; day: number }): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

/**
 * Find UTC hours in a 72-hour window around `date` (YYYY-MM-DD) where every
 * zone is in [workStart, workEnd) and at least one zone is on that local date.
 * startHour/endHour still filter by UTC hour-of-day. Do not require every
 * zone to share the same calendar date — that hides real date-line overlaps.
 */
export function overlapWindows({
  zones,
  date,
  startHour,
  endHour,
  workStart = 9,
  workEnd = 17,
}: OverlapWindowsInput): OverlapWindow[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError("date must be YYYY-MM-DD.");
  assertHour(startHour, "startHour");
  assertHour(endHour, "endHour");
  assertWorkBound(workStart, "workStart");
  assertWorkBound(workEnd, "workEnd");
  if (workStart >= workEnd) throw new RangeError("workStart must be less than workEnd.");
  if (zones.length === 0) return [];
  for (const zone of zones) {
    if (!isValidTimeZone(zone)) throw new RangeError(`Invalid IANA time zone: ${zone}.`);
  }

  const [year, month, day] = date.split("-").map(Number);
  const results: OverlapWindow[] = [];
  const hourStart = Math.min(startHour, endHour);
  const hourEnd = Math.max(startHour, endHour);

  for (let dayOffset = -1; dayOffset <= 1; dayOffset += 1) {
    for (let utcHour = hourStart; utcHour <= hourEnd; utcHour += 1) {
      const instant = new Date(Date.UTC(year, month - 1, day + dayOffset, utcHour, 0, 0, 0));
      const localHours: Record<string, number> = {};
      let onPickedDate = false;
      let ok = true;
      for (const zone of zones) {
        const parts = getTimeZoneParts(instant, zone);
        if (parts.hour < workStart || parts.hour >= workEnd) {
          ok = false;
          break;
        }
        if (localIsoDate(parts) === date) onPickedDate = true;
        localHours[zone] = parts.hour;
      }
      if (ok && onPickedDate) {
        results.push({ utcHour, utcIso: instant.toISOString(), localHours });
      }
    }
  }
  return results;
}
