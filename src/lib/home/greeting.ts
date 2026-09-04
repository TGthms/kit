/**
 * Home greeting catalog contract.
 *
 * Copy lives in `messages/*.json`:
 *   home.greeting.{variant}
 *   home.greeting.observance.{key}
 *   home.greeting.occasionLabel.{key}
 *   home.subtitleFacts.{factN|kitN|prodN|periodN}
 *   home.subtitleObservance.{key} plus `{key}2` / `{key}3`
 *
 * Good Friday’s verse is NOT in catalogs. See `verses.ts` (WEB, untranslated).
 *
 * To add an observance later:
 *   1. Append a rule to OBSERVANCE_RULES and the key to OBSERVANCE_KEYS
 *   2. Add English occasionLabel, observance, and subtitleObservance strings
 *   3. Add the same keys in every other catalog (greeting-catalog.test.ts fails if a locale is missing or still English)
 *
 * To add a time-of-day line:
 *   1. Append the key to GREETING_PERIOD_KEYS
 *   2. Add copy in every catalog
 *
 * Christian observances (Christmas, Holy Week, Easter) are skipped for
 * `ar` / `he` / `hi`. Chinese (`zh`, `zh-Hans`, `zh-Hant`) is included.
 *
 * Distinct later variants must not recycle extra1–3.
 */
import { subtitleMotionFor, type SubtitleMotion } from "@/lib/home/subtitle-motion";
import { GOOD_FRIDAY_VERSE_ID, type WebVerseId } from "@/lib/home/verses";

export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";
export type GreetingCategory = "timeOfDay" | "weekend" | "productivity" | "kit" | "privacy";

export type GreetingSubtitle =
  | { kind: "i18n"; key: string }
  | { kind: "verse"; id: WebVerseId };

export type HomeGreetingSelection = {
  greetingKey: string;
  subtitle: GreetingSubtitle;
  motion: SubtitleMotion;
  day: string;
  occasionKey?: string;
  category: GreetingCategory;
};

/** 1-based month. `weekday` matches Date.getDay() (0 Sunday … 6 Saturday). */
export type ObservanceRule =
  | { kind: "fixed"; month: number; day: number; key: string }
  | { kind: "nthWeekday"; month: number; weekday: number; occurrence: number; key: string }
  | { kind: "dayOfYear"; dayOfYear: number; key: string }
  | { kind: "easterOffset"; offset: number; key: string };

export const GREETING_PERIOD_KEYS: Record<GreetingPeriod, readonly string[]> = {
  morning: ["morning", "morning2", "morning3", "morning4", "morning5", "morning6", "morning7", "morning8", "morning9", "morning10", "morning11", "morning12", "morning13", "morning14", "morning15"],
  afternoon: ["afternoon", "afternoon2", "afternoon3", "afternoon4", "afternoon5", "afternoon6", "afternoon7", "afternoon8", "afternoon9", "afternoon10", "afternoon11", "afternoon12", "afternoon13", "afternoon14", "afternoon15"],
  evening: ["evening", "evening2", "evening3", "evening4", "evening5", "evening6", "evening7", "evening8", "evening9", "evening10", "evening11", "evening12", "evening13", "evening14", "evening15"],
  night: ["night", "night2", "night3", "night4", "night5", "night6", "night7", "night8", "night9", "night10", "night11", "night12", "night13", "night14", "night15"],
};

export const GREETING_CONTEXT_KEYS = [
  "weekend", "weekend2", "weekend3",
  "productivity", "productivity2", "productivity3",
  "kit", "kit2", "kit3",
  "privacy", "privacy2", "privacy3",
  "monday", "friday",
] as const;

export const GREETING_VARIANT_KEYS = [
  ...GREETING_PERIOD_KEYS.morning,
  ...GREETING_PERIOD_KEYS.afternoon,
  ...GREETING_PERIOD_KEYS.evening,
  ...GREETING_PERIOD_KEYS.night,
  ...GREETING_CONTEXT_KEYS,
] as const;

/** Lines that should stay unique per locale, not copies of extra1–3. */
export const GREETING_DISTINCT_VARIANT_KEYS = [
  "morning2", "morning3", "morning4", "morning5", "morning6", "morning7", "morning8", "morning9", "morning10",
  "morning11", "morning12", "morning13", "morning14", "morning15",
  "afternoon2", "afternoon3", "afternoon4", "afternoon5", "afternoon6", "afternoon7", "afternoon8", "afternoon9", "afternoon10",
  "afternoon11", "afternoon12", "afternoon13", "afternoon14", "afternoon15",
  "evening2", "evening3", "evening4", "evening5", "evening6", "evening7", "evening8", "evening9", "evening10",
  "evening11", "evening12", "evening13", "evening14", "evening15",
  "night2", "night3", "night4", "night5", "night6", "night7", "night8", "night9", "night10",
  "night11", "night12", "night13", "night14", "night15",
  "weekend", "weekend2", "weekend3",
  "monday", "friday",
  "kit2", "kit3", "privacy2", "privacy3", "productivity2", "productivity3",
] as const;

export const NEW_YEAR_CARD_KEYS = [
  "countdownTitle",
  "countdownSubtitle",
  "celebrateTitle",
  "celebrateSubtitle",
  "countdownLabel",
] as const;

export const SUBTITLE_FACT_KEYS = [
  "fact1", "fact2", "fact3", "fact4", "fact5", "fact6", "fact7", "fact8",
  "kit1", "kit2", "kit3", "kit4", "kit5", "kit6", "kit7", "kit8",
  "prod1", "prod2", "prod3", "prod4", "prod5", "prod6",
  "morning1", "morning2", "morning3",
  "afternoon1", "afternoon2", "afternoon3",
  "evening1", "evening2", "evening3",
  "night1", "night2", "night3",
] as const;

/** Kit-knowledge subs (privacy, browser-only, files stay). */
export const KIT_SUBTITLE_KEYS = [
  "subtitleFacts.kit1",
  "subtitleFacts.kit2",
  "subtitleFacts.kit3",
  "subtitleFacts.kit4",
  "subtitleFacts.kit5",
  "subtitleFacts.kit6",
  "subtitleFacts.kit7",
  "subtitleFacts.kit8",
  "subtitleFacts.fact2",
  "subtitleFacts.fact4",
  "subtitleFacts.fact6",
  "subtitleFacts.fact7",
] as const;

/** Workflow / two-minute-win subs. */
export const PRODUCTIVITY_SUBTITLE_KEYS = [
  "subtitleFacts.prod1",
  "subtitleFacts.prod2",
  "subtitleFacts.prod3",
  "subtitleFacts.prod4",
  "subtitleFacts.prod5",
  "subtitleFacts.prod6",
  "subtitleFacts.fact1",
  "subtitleFacts.fact5",
  "subtitleFacts.fact8",
] as const;

export const GENERAL_SUBTITLE_KEYS = [
  "subtitle",
  "subtitleFacts.fact1",
  "subtitleFacts.fact2",
  "subtitleFacts.fact3",
  "subtitleFacts.fact4",
  "subtitleFacts.fact5",
  "subtitleFacts.fact6",
  "subtitleFacts.fact7",
  "subtitleFacts.fact8",
] as const;

export const PERIOD_SUBTITLE_KEYS: Record<GreetingPeriod, readonly string[]> = {
  morning: ["subtitleFacts.morning1", "subtitleFacts.morning2", "subtitleFacts.morning3"],
  afternoon: ["subtitleFacts.afternoon1", "subtitleFacts.afternoon2", "subtitleFacts.afternoon3"],
  evening: ["subtitleFacts.evening1", "subtitleFacts.evening2", "subtitleFacts.evening3"],
  night: ["subtitleFacts.night1", "subtitleFacts.night2", "subtitleFacts.night3"],
};

export const WEEKEND_SUBTITLE_KEYS = [
  ...KIT_SUBTITLE_KEYS,
  "subtitle",
  "subtitleFacts.fact1",
  "subtitleFacts.fact5",
] as const;

export const CHRISTIAN_OBSERVANCE_KEYS = [
  "christmasEve",
  "christmas",
  "goodFriday",
  "palmSunday",
  "easterMonday",
  "easterSunday",
] as const;

const CHRISTIAN_GREETING_EXCLUDED_LANGUAGES = new Set(["ar", "he", "hi"]);

/** Chinese locales are included; Arabic, Hebrew, and Hindi are not. */
export function localeAllowsChristianGreeting(locale: string): boolean {
  const language = locale.toLowerCase().replace(/_/g, "-").split("-")[0] ?? locale;
  return !CHRISTIAN_GREETING_EXCLUDED_LANGUAGES.has(language);
}

export const OBSERVANCE_KEYS = [
  "newYear",
  "christmasEve",
  "christmas",
  "goodFriday",
  "palmSunday",
  "easterMonday",
  "easterSunday",
  "saferInternetDay",
  "womenAndGirlsInScience",
  "piDay",
  "backupDay",
  "earthDay",
  "passwordDay",
  "webDay",
  "adaLovelaceDay",
  "computerSecurityDay",
  "programmersDay",
  "dataPrivacyDay",
  "emojiDay",
  "softwareFreedomDay",
  "encryptionDay",
  "internetDay",
  "digitalPreservationDay",
] as const;

export const OBSERVANCE_RULES: readonly ObservanceRule[] = [
  { kind: "fixed", month: 1, day: 1, key: "newYear" },
  { kind: "fixed", month: 1, day: 28, key: "dataPrivacyDay" },
  { kind: "fixed", month: 2, day: 11, key: "womenAndGirlsInScience" },
  { kind: "fixed", month: 3, day: 14, key: "piDay" },
  { kind: "fixed", month: 3, day: 31, key: "backupDay" },
  { kind: "fixed", month: 4, day: 22, key: "earthDay" },
  { kind: "fixed", month: 7, day: 17, key: "emojiDay" },
  { kind: "fixed", month: 8, day: 1, key: "webDay" },
  { kind: "fixed", month: 10, day: 21, key: "encryptionDay" },
  { kind: "fixed", month: 10, day: 29, key: "internetDay" },
  { kind: "fixed", month: 11, day: 30, key: "computerSecurityDay" },
  { kind: "fixed", month: 12, day: 24, key: "christmasEve" },
  { kind: "fixed", month: 12, day: 25, key: "christmas" },
  { kind: "nthWeekday", month: 2, weekday: 2, occurrence: 2, key: "saferInternetDay" },
  { kind: "nthWeekday", month: 5, weekday: 4, occurrence: 1, key: "passwordDay" },
  { kind: "nthWeekday", month: 9, weekday: 6, occurrence: 3, key: "softwareFreedomDay" },
  { kind: "nthWeekday", month: 10, weekday: 2, occurrence: 2, key: "adaLovelaceDay" },
  { kind: "nthWeekday", month: 11, weekday: 4, occurrence: 1, key: "digitalPreservationDay" },
  { kind: "dayOfYear", dayOfYear: 256, key: "programmersDay" },
  { kind: "easterOffset", offset: -7, key: "palmSunday" },
  { kind: "easterOffset", offset: -2, key: "goodFriday" },
  { kind: "easterOffset", offset: 0, key: "easterSunday" },
  { kind: "easterOffset", offset: 1, key: "easterMonday" },
];

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

/** Slot aligned with greeting periods (night / morning / afternoon / evening / late night). */
export function getGreetingPeriodSlot(date: Date): number {
  const hour = date.getHours();
  if (hour < 5) return 0;
  if (hour < 12) return 1;
  if (hour < 17) return 2;
  if (hour < 22) return 3;
  return 4;
}

/** Produces a stable selection for a greeting period without minute-by-minute churn. */
export function getGreetingVariant(date: Date, count = 4, entropy = 0): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError("count must be a positive integer.");
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000);
  const raw = dayOfYear * 13 + getGreetingPeriodSlot(date) * 7 + Math.trunc(entropy);
  return ((raw % count) + count) % count;
}

function dateKey(date: Date): string {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function isNthWeekdayOfMonth(date: Date, month: number, weekday: number, occurrence: number): boolean {
  if (date.getMonth() !== month - 1 || date.getDay() !== weekday) return false;
  return Math.floor((date.getDate() - 1) / 7) + 1 === occurrence;
}

function isDayOfYear(date: Date, dayOfYear: number): boolean {
  const year = date.getFullYear();
  return Math.floor((Date.UTC(year, date.getMonth(), date.getDate()) - Date.UTC(year, 0, 1)) / 86_400_000) + 1 === dayOfYear;
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

function getObservanceKey(date: Date): string | null {
  const key = dateKey(date);
  for (const rule of OBSERVANCE_RULES) {
    if (rule.kind === "fixed" && key === `${rule.month}-${rule.day}`) return rule.key;
  }
  for (const rule of OBSERVANCE_RULES) {
    if (rule.kind === "nthWeekday" && isNthWeekdayOfMonth(date, rule.month, rule.weekday, rule.occurrence)) return rule.key;
    if (rule.kind === "dayOfYear" && isDayOfYear(date, rule.dayOfYear)) return rule.key;
  }
  return null;
}

function getChristianObservanceKey(date: Date): string | null {
  const easter = easterSunday(date.getFullYear());
  for (const rule of OBSERVANCE_RULES) {
    if (rule.kind !== "easterOffset") continue;
    const day = new Date(easter);
    day.setDate(day.getDate() + rule.offset);
    if (sameDate(date, day)) return rule.key;
  }
  return null;
}

function isChristianObservanceKey(key: string): boolean {
  return (CHRISTIAN_OBSERVANCE_KEYS as readonly string[]).includes(key);
}

function pickObservanceKey(date: Date, locale: string, skipOccasionKeys: readonly string[] = []): string | null {
  const candidate = getChristianObservanceKey(date) ?? getObservanceKey(date);
  if (!candidate) return null;
  if (skipOccasionKeys.includes(candidate)) return null;
  if (isChristianObservanceKey(candidate) && !localeAllowsChristianGreeting(locale)) return null;
  return candidate;
}

function categoryForKey(key: string): GreetingCategory {
  if (key === "weekend" || key === "weekend2" || key === "weekend3") return "weekend";
  if (key.startsWith("productivity")) return "productivity";
  if (key.startsWith("kit")) return "kit";
  if (key.startsWith("privacy")) return "privacy";
  return "timeOfDay";
}

function pickKey(keys: readonly string[], entropy: number): string {
  const count = keys.length;
  if (count < 1) throw new RangeError("subtitle pool is empty.");
  return keys[((entropy % count) + count) % count];
}

export function subtitlePoolFor(category: GreetingCategory, period: GreetingPeriod): readonly string[] {
  if (category === "kit" || category === "privacy") return KIT_SUBTITLE_KEYS;
  if (category === "productivity") return PRODUCTIVITY_SUBTITLE_KEYS;
  if (category === "weekend") return WEEKEND_SUBTITLE_KEYS;
  return [...GENERAL_SUBTITLE_KEYS, ...PERIOD_SUBTITLE_KEYS[period]];
}

/** Observance subtitles. Good Friday selection uses the WEB verse; catalogs still keep three slots. */
export function observanceSubtitleKeys(occasionKey: string): readonly string[] {
  return [`subtitleObservance.${occasionKey}`, `subtitleObservance.${occasionKey}2`, `subtitleObservance.${occasionKey}3`];
}

/** Time-of-day lines plus signature extras; weekend / Monday / Friday flavor joins the pool. */
export function getGreetingPoolKeys(date: Date): readonly string[] {
  const period = getGreetingPeriod(date);
  const periodKeys = GREETING_PERIOD_KEYS[period];
  const extras = ["kit", "kit2", "kit3", "productivity", "productivity2", "productivity3", "privacy", "privacy2", "privacy3"] as const;
  const weekday = date.getDay();
  const flavor: string[] = [];
  if (weekday === 1 && period === "morning") flavor.push("monday");
  if (weekday === 5 && (period === "afternoon" || period === "evening" || period === "night")) flavor.push("friday");
  const isWeekend = weekday === 0 || weekday === 6;
  return isWeekend ? [...periodKeys, ...extras, "weekend", "weekend2", "weekend3"] : [...periodKeys, ...extras, ...flavor];
}

export function getHomeGreetingSelection(
  date: Date,
  locale: string,
  variant: number,
  options?: { skipOccasionKeys?: readonly string[] },
): HomeGreetingSelection {
  const day = getGreetingDay(date, locale);
  const period = getGreetingPeriod(date);
  const entropy = Math.abs(Math.trunc(variant));
  const subtitleEntropy = Math.abs(Math.trunc(variant * 5 + date.getDate()));
  const observance = pickObservanceKey(date, locale, options?.skipOccasionKeys);

  if (observance === "goodFriday") {
    const greetingKey = "greeting.observance.goodFriday";
    return {
      greetingKey,
      subtitle: { kind: "verse", id: GOOD_FRIDAY_VERSE_ID },
      motion: subtitleMotionFor({ occasionKey: observance, period }),
      occasionKey: observance,
      category: "kit",
      day,
    };
  }

  if (observance) {
    const greetingKey = `greeting.observance.${observance}`;
    return {
      greetingKey,
      subtitle: { kind: "i18n", key: pickKey(observanceSubtitleKeys(observance), subtitleEntropy) },
      motion: subtitleMotionFor({ occasionKey: observance, period }),
      occasionKey: observance,
      category: "kit",
      day,
    };
  }

  const pool = getGreetingPoolKeys(date);
  const key = pool[entropy % pool.length];
  const category = categoryForKey(key);
  const greetingKey = `greeting.${key}`;
  return {
    greetingKey,
    subtitle: { kind: "i18n", key: pickKey(subtitlePoolFor(category, period), subtitleEntropy) },
    motion: subtitleMotionFor({ period }),
    category,
    day,
  };
}
