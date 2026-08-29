export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";
export type GreetingCategory = "timeOfDay" | "weekend" | "productivity" | "kit" | "privacy";

export type HomeGreetingSelection = {
  greetingKey: string;
  subtitleKey: string;
  day: string;
  occasionKey?: string;
  category: GreetingCategory;
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

/** Returns a fresh visit seed and gracefully handles private-mode API restrictions. */
export function getGreetingVisitSeed(): number {
  if (typeof window === "undefined") return 0;
  try {
    const values = new Uint32Array(1);
    window.crypto?.getRandomValues(values);
    return values[0] ?? 0;
  } catch {
    return 0;
  }
}

/** Produces a stable selection for a calendar/time slot without minute-by-minute churn. */
export function getGreetingVariant(date: Date, count = 4, entropy = 0): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError("count must be a positive integer.");
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000);
  const periodSlot = Math.floor(date.getHours() / 6);
  const raw = dayOfYear * 13 + periodSlot * 7 + Math.trunc(entropy);
  return ((raw % count) + count) % count;
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
  return Math.floor((Date.UTC(year, date.getMonth(), date.getDate()) - Date.UTC(year, 0, 1)) / 86_400_000) + 1 === dayOfYear;
}

function getObservanceKey(date: Date): string | null {
  const fixed: Record<string, string> = {
    "1-1": "newYear", "2-11": "womenAndGirlsInScience", "3-14": "piDay", "3-31": "backupDay",
    "4-22": "earthDay", "8-1": "webDay", "11-30": "computerSecurityDay", "12-24": "christmasEve", "12-25": "christmas",
  };
  const key = dateKey(date);
  if (fixed[key]) return fixed[key];
  if (isNthWeekdayOfMonth(date, 1, 2, 2)) return "saferInternetDay";
  if (isNthWeekdayOfMonth(date, 4, 4, 1)) return "passwordDay";
  if (isNthWeekdayOfMonth(date, 9, 2, 2)) return "adaLovelaceDay";
  if (isDayOfYear(date, 256)) return "programmersDay";
  return null;
}

function easterSunday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function sameDate(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function getChristianObservanceKey(date: Date): string | null {
  const easter = easterSunday(date.getFullYear());
  for (const [offset, key] of [[-2, "goodFriday"], [-7, "palmSunday"], [1, "easterMonday"], [0, "easterSunday"]] as const) {
    const day = new Date(easter);
    day.setDate(day.getDate() + offset);
    if (sameDate(date, day)) return key;
  }
  return null;
}

const periodKeys: Record<GreetingPeriod, string[]> = {
  morning: ["morning", "morning2", "morning3", "morning4", "morning5", "morning6", "morning7", "morning8"],
  afternoon: ["afternoon", "afternoon2", "afternoon3", "afternoon4", "afternoon5", "afternoon6", "afternoon7", "afternoon8"],
  evening: ["evening", "evening2", "evening3", "evening4", "evening5", "evening6", "evening7", "evening8"],
  night: ["night", "night2", "night3", "night4", "night5", "night6", "night7", "night8"],
};
const subtitlePool = ["subtitle", "subtitleFacts.fact1", "subtitleFacts.fact2", "subtitleFacts.fact3", "subtitleFacts.fact4", "subtitleFacts.fact5", "subtitleFacts.fact6"];

export function getHomeGreetingSelection(date: Date, locale: string, variant: number): HomeGreetingSelection {
  const observance = getChristianObservanceKey(date) ?? getObservanceKey(date);
  const day = getGreetingDay(date, locale);
  if (observance) return { greetingKey: `greeting.observance.${observance}`, subtitleKey: `subtitleObservance.${observance}`, occasionKey: observance, category: "kit", day };
  const period = getGreetingPeriod(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const index = Math.abs(Math.trunc(variant)) % periodKeys[period].length;
  const category: GreetingCategory = isWeekend && index === 0 ? "weekend" : index === 1 ? "productivity" : index === 2 ? "kit" : index === 7 ? "privacy" : "timeOfDay";
  const greetingKey = isWeekend && index === 0 ? "greeting.weekend" : index === 1 ? "greeting.productivity" : index === 2 ? "greeting.kit" : index === 7 ? "greeting.privacy" : `greeting.${periodKeys[period][index]}`;
  const subtitleIndex = Math.abs(Math.trunc(variant * 5 + date.getDate())) % subtitlePool.length;
  return { greetingKey, subtitleKey: subtitlePool[subtitleIndex], category, day };
}
