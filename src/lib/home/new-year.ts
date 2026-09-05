/** Gregorian New Year card: last 10 local minutes of 31 Dec, then all of 1 Jan. */

export const NEW_YEAR_COUNTDOWN_MS = 10 * 60 * 1000;
export const NEW_YEAR_FIREWORKS_MS = 10_000;

export type NewYearCardPhase = "hidden" | "countdown" | "celebrate";

export type NewYearCardState = {
  phase: NewYearCardPhase;
  /** Milliseconds until local midnight of 1 Jan. 0 once that instant has passed. */
  msLeft: number;
  /** Year being arrived at during countdown; the current year on 1 Jan. */
  year: number;
  /** Milliseconds since local 1 Jan 00:00. 0 during countdown. */
  msSinceStart: number;
};

export function newYearStart(now: Date): Date {
  const month = now.getMonth();
  const year = month === 11 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 0, 1, 0, 0, 0, 0);
}

export function getNewYearCardState(now: Date): NewYearCardState {
  const start = newYearStart(now);
  const year = start.getFullYear();
  const delta = start.getTime() - now.getTime();

  if (delta > NEW_YEAR_COUNTDOWN_MS) {
    return { phase: "hidden", msLeft: delta, year, msSinceStart: 0 };
  }
  if (delta > 0) {
    return { phase: "countdown", msLeft: delta, year, msSinceStart: 0 };
  }

  const onNewYearDay = now.getMonth() === 0 && now.getDate() === 1;
  if (!onNewYearDay) {
    return { phase: "hidden", msLeft: 0, year, msSinceStart: Math.max(0, -delta) };
  }
  return { phase: "celebrate", msLeft: 0, year, msSinceStart: Math.max(0, -delta) };
}

export function countdownParts(msLeft: number): { minutes: number; seconds: number } {
  const clamped = Math.max(0, Math.ceil(msLeft / 1000));
  return {
    minutes: Math.floor(clamped / 60),
    seconds: clamped % 60,
  };
}

export type CountdownSubtitleKind = "minutes" | "minute" | "seconds";

/** Copy that still says “ten minutes” at 00:10 is wrong; pick by remaining minutes. */
export function countdownSubtitleKind(minutes: number): CountdownSubtitleKind {
  if (minutes >= 2) return "minutes";
  if (minutes === 1) return "minute";
  return "seconds";
}

/** Fireworks only when the year has just turned, not all of 1 Jan. */
export function shouldPlayNewYearFireworks(state: NewYearCardState): boolean {
  return state.phase === "celebrate" && state.msSinceStart < NEW_YEAR_FIREWORKS_MS;
}

/**
 * Time until the next New Year *phase* change on the home page.
 * 0 means the greeting period timer can run. The countdown clock ticks inside
 * the card — this must not be a 250ms home-wide wake.
 *
 * Hidden-before-countdown wakes at 23:50 on 31 Dec. Countdown wakes at midnight.
 * Celebrate wakes when fireworks should stop, then 2 Jan as an upper bound
 * (callers still take the sooner greeting-period tick).
 */
export function nextNewYearTickMs(state: NewYearCardState, now: Date): number {
  if (state.phase === "countdown") return Math.max(50, state.msLeft);
  if (state.phase === "celebrate") {
    if (state.msSinceStart < NEW_YEAR_FIREWORKS_MS) {
      return Math.max(50, NEW_YEAR_FIREWORKS_MS - state.msSinceStart);
    }
    const end = new Date(now.getFullYear(), 0, 2, 0, 0, 0, 0);
    return Math.max(1000, end.getTime() - now.getTime() + 100);
  }
  if (state.msLeft > NEW_YEAR_COUNTDOWN_MS) {
    return Math.max(50, state.msLeft - NEW_YEAR_COUNTDOWN_MS);
  }
  return 0;
}
