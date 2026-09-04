import type { GreetingPeriod } from "@/lib/home/greeting";

export type SubtitleMotion = "fade" | "fadeSlow";

/** Solemn days: slower opacity fade, no transform. */
export const SOLEMN_OBSERVANCE_KEYS = new Set(["goodFriday", "palmSunday"]);

export function subtitleMotionFor({
  occasionKey,
  period,
}: {
  occasionKey?: string;
  period: GreetingPeriod;
}): SubtitleMotion {
  if (occasionKey && SOLEMN_OBSERVANCE_KEYS.has(occasionKey)) return "fadeSlow";
  if (period === "evening" || period === "night") return "fadeSlow";
  return "fade";
}
