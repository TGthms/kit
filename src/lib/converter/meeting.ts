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

/**
 * Find UTC hours on `date` (YYYY-MM-DD) between startHour..endHour where every
 * zone's local calendar date matches and local hour is in [workStart, workEnd).
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

  for (let utcHour = hourStart; utcHour <= hourEnd; utcHour += 1) {
    const instant = new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0, 0));
    const localHours: Record<string, number> = {};
    let ok = true;
    for (const zone of zones) {
      const parts = getTimeZoneParts(instant, zone);
      const localDate = `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
      if (localDate !== date || parts.hour < workStart || parts.hour >= workEnd) {
        ok = false;
        break;
      }
      localHours[zone] = parts.hour;
    }
    if (ok) {
      results.push({ utcHour, utcIso: instant.toISOString(), localHours });
    }
  }
  return results;
}
