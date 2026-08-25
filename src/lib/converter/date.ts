export type DateInput = Date | number | string;
export type DateUnit = "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";

export type DateDifference = {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  weeks: number;
};

export type BusinessDayOptions = {
  inclusive?: boolean;
  holidays?: readonly string[];
};

function toDate(value: DateInput): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError("Date must be valid.");
  return date;
}

function startOfDay(value: DateInput): Date {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(value: DateInput): string {
  const date = toDate(value);
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarDayNumber(value: DateInput): number {
  const date = toDate(value);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || !Number.isFinite(value)) throw new RangeError(`${name} must be an integer.`);
}

export function differenceBetweenDates(start: DateInput, end: DateInput, absolute = false): DateDifference {
  const milliseconds = toDate(end).getTime() - toDate(start).getTime();
  const value = absolute ? Math.abs(milliseconds) : milliseconds;
  return {
    milliseconds: value,
    seconds: value / 1000,
    minutes: value / 60000,
    hours: value / 3600000,
    days: value / 86400000,
    weeks: value / 604800000,
  };
}

export function differenceInCalendarDays(start: DateInput, end: DateInput, absolute = false): number {
  const difference = calendarDayNumber(end) - calendarDayNumber(start);
  return absolute ? Math.abs(difference) : difference;
}

export function addDate(value: DateInput, amount: number, unit: DateUnit): Date {
  const date = toDate(value);
  if (!Number.isFinite(amount)) throw new RangeError("Amount must be finite.");
  if (unit === "milliseconds") date.setTime(date.getTime() + amount);
  else if (unit === "seconds") date.setTime(date.getTime() + amount * 1000);
  else if (unit === "minutes") date.setTime(date.getTime() + amount * 60000);
  else if (unit === "hours") date.setTime(date.getTime() + amount * 3600000);
  else if (unit === "days") date.setDate(date.getDate() + amount);
  else if (unit === "weeks") date.setDate(date.getDate() + amount * 7);
  else if (unit === "months" || unit === "years") {
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + (unit === "months" ? amount : amount * 12));
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDay));
  } else {
    throw new RangeError("Unsupported date unit.");
  }
  return date;
}

export function subtractDate(value: DateInput, amount: number, unit: DateUnit): Date {
  return addDate(value, -amount, unit);
}

function holidaySet(holidays: readonly string[]): Set<string> {
  for (const holiday of holidays) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday)) throw new RangeError("Holidays must use YYYY-MM-DD format.");
  }
  return new Set(holidays);
}

export function isBusinessDay(value: DateInput, holidays: readonly string[] = []): boolean {
  const date = toDate(value);
  const day = date.getDay();
  return day !== 0 && day !== 6 && !holidaySet(holidays).has(dateKey(date));
}

export function countBusinessDays(start: DateInput, end: DateInput, options: BusinessDayOptions = {}): number {
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);
  const startNumber = startDay.getTime();
  const endNumber = endDay.getTime();
  if (startNumber === endNumber) return options.inclusive && isBusinessDay(startDay, options.holidays ?? []) ? 1 : 0;
  const direction = startNumber < endNumber ? 1 : -1;
  const first = direction === 1 ? startDay : endDay;
  const last = direction === 1 ? endDay : startDay;
  const cursor = options.inclusive ? new Date(first) : addDate(first, 1, "days");
  const holidays = options.holidays ?? [];
  let count = 0;
  while (cursor.getTime() <= last.getTime()) {
    if (isBusinessDay(cursor, holidays)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count * direction;
}

export function addBusinessDays(value: DateInput, amount: number, holidays: readonly string[] = []): Date {
  assertInteger(amount, "amount");
  const result = startOfDay(value);
  if (amount === 0) return result;
  const direction = amount > 0 ? 1 : -1;
  let remaining = Math.abs(amount);
  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    if (isBusinessDay(result, holidays)) remaining -= 1;
  }
  return result;
}
