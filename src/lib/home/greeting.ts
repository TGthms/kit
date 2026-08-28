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
export function getGreetingVariant(date: Date, count = 4, entropy = 0): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError("count must be a positive integer.");
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000);
  const slot = Math.floor(date.getHours() / 2);
  return (dayOfYear * 13 + slot * 7 + Math.trunc(entropy)) % count;
}

export function getHomeGreeting(date: Date, variant: number): string {
  const period = getGreetingPeriod(date);
  const timeBased: Record<GreetingPeriod, string[]> = {
    morning: ["Good morning", "Morning", "Fresh start", "New day, new ideas", "Coffee and Kit time?", "Time to get things done"],
    afternoon: ["Good afternoon", "Afternoon", "Midday check-in", "Ready for the next task?", "Time to keep building", "Another productive session"],
    evening: ["Good evening", "Evening", "Evening session?", "A quiet moment to create", "End-of-day ideas welcome", "Time to wrap things up or start something new"],
    night: ["Good evening, night owl", "Hello, night owl", "Late night session?", "Quiet hours, creative hours", "One more idea before bed?", "Late night thoughts?"],
  };
  const shared = ["Welcome back", "Good to see you again", "Ready when you are", "Let’s get started", "What can we work on today?", "What are we solving today?", "Kit is ready", "Your toolkit is ready", "Tools at your fingertips", "Pick a tool and get started", "Simple tools, big results", "Ideas welcome", "Curiosity mode activated", "Private workspace ready", "Anonymous and ready", "No introduction needed"];
  const options = [...timeBased[period], ...shared];
  return options[Math.abs(Math.trunc(variant)) % options.length] ?? options[0];
}

export function getHomeSubtitle(variant: number): string {
  const subtitles = [
    "A calm little toolkit for the things you need to get done today.",
    "Convert, calculate, write, and make progress—right here in your browser.",
    "Small, thoughtful tools for making everyday work feel easier.",
    "Your useful tools, ready when you are and private by design.",
    "A simple place to solve the little tasks that keep work moving.",
    "World clocks, converters, calculators, and more—without the clutter.",
    "A focused toolkit for turning small jobs into finished work.",
    "Everything runs right here, so your everyday work stays yours.",
    "Find a useful tool, get it done, and keep moving.",
    "A private workspace for the things you need to figure out.",
    "Practical tools for curious people and busy days.",
    "The right little tool can make a big task feel lighter.",
  ];
  return subtitles[Math.abs(Math.trunc(variant)) % subtitles.length];
}
