export type DateInput = Date | number | string;

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timeZone: string;
};

export type TimeZoneFormatOptions = Omit<Intl.DateTimeFormatOptions, "timeZone"> & {
  locale?: string;
};

export type TimeZoneConversion = {
  instant: Date;
  fromTimeZone: string;
  toTimeZone: string;
  from: ZonedParts;
  to: ZonedParts;
};

function toDate(value: DateInput): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError("Date must be valid.");
  return date;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

function assertTimeZone(timeZone: string): void {
  if (!isValidTimeZone(timeZone)) throw new RangeError(`Invalid IANA time zone: ${timeZone}.`);
}

function partNumber(parts: Intl.DateTimeFormatPart[], type: string): number {
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) throw new Error(`Time zone formatter omitted ${type}.`);
  return Number(value);
}

export function getTimeZoneParts(value: DateInput, timeZone: string, locale = "en-US"): ZonedParts {
  const date = toDate(value);
  assertTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return {
    year: partNumber(parts, "year"),
    month: partNumber(parts, "month"),
    day: partNumber(parts, "day"),
    hour: partNumber(parts, "hour"),
    minute: partNumber(parts, "minute"),
    second: partNumber(parts, "second"),
    timeZone,
  };
}

export function formatTimeZone(value: DateInput, timeZone: string, options: TimeZoneFormatOptions = {}): string {
  assertTimeZone(timeZone);
  const { locale = "en-US", ...formatOptions } = options;
  return new Intl.DateTimeFormat(locale, { ...formatOptions, timeZone }).format(toDate(value));
}

export function getTimeZoneOffsetMinutes(value: DateInput, timeZone: string): number {
  const date = toDate(value);
  const parts = getTimeZoneParts(date, timeZone, "en-US");
  const reconstructed = new Date(0);
  reconstructed.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  reconstructed.setUTCHours(parts.hour, parts.minute, parts.second, date.getUTCMilliseconds());
  return (reconstructed.getTime() - date.getTime()) / 60000;
}

export function convertTimeZone(value: DateInput, fromTimeZone: string, toTimeZone: string, locale = "en-US"): TimeZoneConversion {
  const instant = toDate(value);
  const from = getTimeZoneParts(instant, fromTimeZone, locale);
  const to = getTimeZoneParts(instant, toTimeZone, locale);
  return { instant, fromTimeZone, toTimeZone, from, to };
}

function parseLocalDateTime(value: string): [number, number, number, number, number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/u.exec(value);
  if (!match) throw new RangeError("Local date-time must use YYYY-MM-DDTHH:mm[:ss[.SSS]].");
  const [, year, month, day, hour, minute, second = "0", milliseconds = "0"] = match;
  const numbers = [Number(year), Number(month), Number(day), Number(hour), Number(minute), Number(second), Number(milliseconds.padEnd(3, "0"))];
  const [parsedYear, parsedMonth, parsedDay, parsedHour, parsedMinute, parsedSecond, parsedMilliseconds] = numbers;
  if (parsedMonth < 1 || parsedMonth > 12 || parsedHour > 23 || parsedMinute > 59 || parsedSecond > 59 || parsedMilliseconds > 999) throw new RangeError("Local date-time is invalid.");
  const check = new Date(0);
  check.setUTCFullYear(parsedYear, parsedMonth - 1, parsedDay);
  check.setUTCHours(parsedHour, parsedMinute, parsedSecond, parsedMilliseconds);
  if (check.getUTCFullYear() !== parsedYear || check.getUTCMonth() !== parsedMonth - 1 || check.getUTCDate() !== parsedDay) throw new RangeError("Local date-time is invalid.");
  return [parsedYear, parsedMonth, parsedDay, parsedHour, parsedMinute, parsedSecond, parsedMilliseconds];
}

export function convertLocalTimeZone(localDateTime: string, fromTimeZone: string, toTimeZone: string, locale = "en-US"): TimeZoneConversion {
  assertTimeZone(fromTimeZone);
  assertTimeZone(toTimeZone);
  const [year, month, day, hour, minute, second, milliseconds] = parseLocalDateTime(localDateTime);
  const wall = new Date(0);
  wall.setUTCFullYear(year, month - 1, day);
  wall.setUTCHours(hour, minute, second, milliseconds);
  let instantMs = wall.getTime() - getTimeZoneOffsetMinutes(wall, fromTimeZone) * 60000;
  instantMs -= getTimeZoneOffsetMinutes(new Date(instantMs), fromTimeZone) * 60000 - getTimeZoneOffsetMinutes(wall, fromTimeZone) * 60000;
  const instant = new Date(instantMs);
  return convertTimeZone(instant, fromTimeZone, toTimeZone, locale);
}
