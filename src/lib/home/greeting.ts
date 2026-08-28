export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

export type HomeGreetingSelection = {
  greetingKey: string;
  subtitleKey: string;
  day: string;
  occasionKey?: string;
};

export function getGreetingPeriod(date: Date): GreetingPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function getGreetingDay(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
}

/**
 * Selects a repeatable-but-changing variant without using randomness during
 * render. The two-hour slot makes the greeting feel shuffled throughout the
 * day while keeping server and client hydration deterministic.
 */
export function getGreetingVariant(date: Date, count = 4, entropy = 0): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError("count must be a positive integer.");
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000);
  const slot = Math.floor(date.getHours() / 2);
  return (dayOfYear * 13 + slot * 7 + Math.trunc(entropy)) % count;
}

function dateKey(date: Date): string {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function isNthWeekdayOfMonth(date: Date, month: number, weekday: number, occurrence: number): boolean {
  if (date.getMonth() !== month || date.getDay() !== weekday) return false;
  return Math.floor((date.getDate() - 1) / 7) + 1 === occurrence;
}

function isDayOfYear(date: Date, dayOfYear: number): boolean {
  const year = date.getFullYear();
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86_400_000) + 1 === dayOfYear;
}

function getObservanceKey(date: Date): string | null {
  const key = dateKey(date);
  const fixed: Record<string, string> = {
    "1-1": "newYear",
    "2-11": "womenAndGirlsInScience",
    "3-14": "piDay",
    "3-31": "backupDay",
    "4-22": "earthDay",
    "8-1": "webDay",
    "11-30": "computerSecurityDay",
    "12-24": "christmasEve",
    "12-25": "christmas",
  };
  if (fixed[key]) return fixed[key];
  if (isNthWeekdayOfMonth(date, 1, 2, 2)) return "saferInternetDay";
  if (isNthWeekdayOfMonth(date, 4, 4, 1)) return "passwordDay";
  if (isNthWeekdayOfMonth(date, 9, 2, 2)) return "adaLovelaceDay";
  if (isDayOfYear(date, 256)) return "programmersDay";
  return null;
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function sameDate(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function getChristianObservanceKey(date: Date): string | null {
  const easter = easterSunday(date.getFullYear());
  const offsets: Array<[number, string]> = [[-2, "goodFriday"], [-7, "palmSunday"], [1, "easterMonday"], [0, "easterSunday"]];
  for (const [offset, key] of offsets) {
    const day = new Date(easter);
    day.setDate(day.getDate() + offset);
    if (sameDate(date, day)) return key;
  }
  return null;
}

export function getHomeGreetingSelection(date: Date, locale: string, variant: number): HomeGreetingSelection {
  const observance = getChristianObservanceKey(date) ?? getObservanceKey(date);
  const day = getGreetingDay(date, locale);
  if (observance) return { greetingKey: "greeting.observance", subtitleKey: "subtitleObservance", occasionKey: observance, day };

  const period = getGreetingPeriod(date);
  const periodKeys: Record<GreetingPeriod, string[]> = {
    morning: ["morning", "morning2", "morning3"],
    afternoon: ["afternoon", "afternoon2", "afternoon3"],
    evening: ["evening", "evening2", "evening3"],
    night: ["night", "night2", "night3"],
  };
  const greetingKey = `greeting.${periodKeys[period][Math.abs(Math.trunc(variant)) % periodKeys[period].length]}`;
  const subtitlePool = ["subtitle", "subtitleFacts.fact1", "subtitleFacts.fact2", "subtitleFacts.fact3", "subtitleFacts.fact4"];
  return { greetingKey, subtitleKey: subtitlePool[Math.abs(Math.trunc(variant * 3 + date.getDate())) % subtitlePool.length], day };
}
