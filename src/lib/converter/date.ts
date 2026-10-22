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

function calendarDayNumber(value: DateInput): number {
  const date = toDate(value);
  const calendar = new Date(0);
  calendar.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  calendar.setUTCHours(0, 0, 0, 0);
  return calendar.getTime() / 86400000;
}

function assertInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be an integer.`);
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
  return toDate(date);
}

export function subtractDate(value: DateInput, amount: number, unit: DateUnit): Date {
  return addDate(value, -amount, unit);
}

/** Bounded calendar work remains instant even for very distant dates. */
export const MAX_BUSINESS_DAY_ADDITION = 1_000_000;
const MAX_HOLIDAYS = 10_000;

function holidayDays(holidays: readonly string[]): Set<number> {
  if (holidays.length > MAX_HOLIDAYS) throw new RangeError(`Use at most ${MAX_HOLIDAYS} holidays.`);
  return new Set(holidays.map((holiday) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(holiday);
    if (!match) throw new RangeError("Holidays must use YYYY-MM-DD format.");
    const [, year, month, day] = match.map(Number);
    const check = new Date(0);
    check.setUTCFullYear(year, month - 1, day);
    check.setUTCHours(0, 0, 0, 0);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
      throw new RangeError("Holiday date is invalid.");
    }
    return check.getTime() / 86400000;
  }));
}

const weekday = (day: number) => ((day + 4) % 7 + 7) % 7;
const workday = (day: number) => weekday(day) !== 0 && weekday(day) !== 6;

/** Inclusive interval: count whole weeks, at most six days, then holidays. */
function countInterval(first: number, last: number, holidays: ReadonlySet<number>): number {
  const length = last - first + 1;
  if (length <= 0) return 0;
  let count = Math.floor(length / 7) * 5;
  for (let i = 0; i < length % 7; i += 1) if (workday(first + i)) count += 1;
  for (const holiday of holidays) if (holiday >= first && holiday <= last && workday(holiday)) count -= 1;
  return count;
}

export function isBusinessDay(value: DateInput, holidays: readonly string[] = []): boolean {
  const day = calendarDayNumber(value);
  return workday(day) && !holidayDays(holidays).has(day);
}

export function countBusinessDays(start: DateInput, end: DateInput, options: BusinessDayOptions = {}): number {
  const first = calendarDayNumber(start);
  const last = calendarDayNumber(end);
  const holidays = holidayDays(options.holidays ?? []);
  if (first === last) return options.inclusive ? countInterval(first, last, holidays) : 0;
  const direction = first < last ? 1 : -1;
  return direction * countInterval(Math.min(first, last) + (options.inclusive ? 0 : 1), Math.max(first, last), holidays);
}

export function addBusinessDays(value: DateInput, amount: number, holidays: readonly string[] = []): Date {
  assertInteger(amount, "amount");
  if (Math.abs(amount) > MAX_BUSINESS_DAY_ADDITION) throw new RangeError(`Use at most ${MAX_BUSINESS_DAY_ADDITION} business days.`);
  const result = startOfDay(value);
  const excluded = holidayDays(holidays);
  if (amount === 0) return result;
  const start = calendarDayNumber(result);
  const direction = amount > 0 ? 1 : -1;
  const required = Math.abs(amount);
  // Even if every supplied holiday falls in the interval, this is sufficient.
  let low = 1;
  let high = Math.ceil((required + excluded.size) / 5) * 7 + 7;
  while (low < high) {
    const distance = Math.floor((low + high) / 2);
    const available = direction > 0 ? countInterval(start + 1, start + distance, excluded)
      : countInterval(start - distance, start - 1, excluded);
    if (available >= required) high = distance;
    else low = distance + 1;
  }
  result.setDate(result.getDate() + direction * low);
  return toDate(result);
}
