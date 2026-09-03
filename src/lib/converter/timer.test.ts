import { describe, expect, it } from "vitest";
import { createStopwatch, createTimer, durationFromHms, getStopwatchElapsed, getTimerRemaining, pauseStopwatch, pauseTimer, POMODORO_BREAK_MS, POMODORO_FOCUS_MS, resetStopwatch, startStopwatch, startTimer, tickTimer } from "./timer";

describe("stopwatch and timer state math", () => {
  it("tracks stopwatch time using immutable state transitions", () => {
    const idle = createStopwatch();
    const running = startStopwatch(idle, 1000);
    expect(getStopwatchElapsed(running, 3500)).toBe(2500);
    const paused = pauseStopwatch(running, 3500);
    expect(paused).toEqual({ status: "paused", elapsedMs: 2500 });
    expect(getStopwatchElapsed(paused, 9000)).toBe(2500);
    expect(resetStopwatch()).toEqual({ status: "idle", elapsedMs: 0 });
  });

  it("pauses, resumes, and finishes countdown timers", () => {
    const timer = startTimer(createTimer(5000), 1000);
    expect(getTimerRemaining(timer, 2500)).toBe(3500);
    const paused = pauseTimer(timer, 2500);
    expect(paused).toMatchObject({ status: "paused", elapsedMs: 1500, remainingMs: 3500 });
    const resumed = startTimer(paused, 5000);
    expect(getTimerRemaining(resumed, 6000)).toBe(2500);
    const finished = tickTimer(resumed, 10000);
    expect(finished).toMatchObject({ status: "finished", elapsedMs: 5000, remainingMs: 0 });
    expect(startTimer(finished, 12000).status).toBe("finished");
  });

  it("handles zero durations and invalid clocks", () => {
    expect(startTimer(createTimer(0), 0).status).toBe("finished");
    expect(() => startStopwatch(createStopwatch(), Number.NaN)).toThrow(RangeError);
    expect(() => createTimer(-1)).toThrow(RangeError);
  });

  it("converts hours, minutes, and seconds into a duration", () => {
    expect(durationFromHms(1, 2, 3)).toBe(3_723_000);
    expect(durationFromHms(0, 5, 0)).toBe(300_000);
    expect(durationFromHms(0, 0, 0)).toBe(0);
    expect(durationFromHms(Number.NaN, -1, 1.8)).toBe(1_000);
  });

  it("exports classic pomodoro durations", () => {
    expect(POMODORO_FOCUS_MS).toBe(25 * 60 * 1000);
    expect(POMODORO_BREAK_MS).toBe(5 * 60 * 1000);
    expect(createTimer(POMODORO_FOCUS_MS).durationMs).toBe(1_500_000);
  });
});
