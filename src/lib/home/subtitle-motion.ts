import type { GreetingCategory, GreetingPeriod } from "@/lib/home/greeting";

export type SubtitleMotion = "fade" | "rise" | "fadeSlow" | "scaleSoft";

/** Festive observances: a very soft scale-in. Includes days that land in later copy waves. */
export const FESTIVE_OBSERVANCE_KEYS = new Set([
  "newYear",
  "christmasEve",
  "christmas",
  "easterSunday",
  "easterMonday",
  "piDay",
  "programmersDay",
  "emojiDay",
]);

/** Solemn days: fade only. */
export const SOLEMN_OBSERVANCE_KEYS = new Set(["goodFriday", "palmSunday"]);

export function subtitleMotionFor({
  occasionKey,
  category,
  period,
  greetingKey,
}: {
  occasionKey?: string;
  category: GreetingCategory;
  period: GreetingPeriod;
  greetingKey: string;
}): SubtitleMotion {
  if (occasionKey && SOLEMN_OBSERVANCE_KEYS.has(occasionKey)) return "fade";
  if (occasionKey && FESTIVE_OBSERVANCE_KEYS.has(occasionKey)) return "scaleSoft";
  if (occasionKey) return "fade";
  if (greetingKey === "greeting.friday" || greetingKey.endsWith(".friday")) return "rise";
  if (category === "weekend" || category === "productivity") return "rise";
  if (category === "kit" || category === "privacy") return "fade";
  if (period === "morning") return "rise";
  if (period === "evening" || period === "night") return "fadeSlow";
  return "fade";
}
