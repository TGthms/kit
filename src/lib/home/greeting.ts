export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

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
export function getGreetingVariant(date: Date, count = 4): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError("count must be a positive integer.");
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000);
  const slot = Math.floor(date.getHours() / 2);
  return (dayOfYear * 13 + slot * 7) % count;
}

export function getHomeSubtitle(variant: number): string {
  const subtitles = [
    "A calm little toolkit for the things you need to get done today.",
    "Useful tools for everyday work, kept private and ready when you are.",
    "Convert, calculate, write, and make progress—right here in your browser.",
    "A handful of thoughtful tools for making small tasks feel easier.",
  ];
  return subtitles[Math.abs(Math.trunc(variant)) % subtitles.length];
}
