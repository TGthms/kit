export type StopwatchStatus = "idle" | "running" | "paused";
export type TimerStatus = "idle" | "running" | "paused" | "finished";

export type StopwatchState = {
  status: StopwatchStatus;
  elapsedMs: number;
  startedAtMs?: number;
};

export type TimerState = {
  status: TimerStatus;
  durationMs: number;
  elapsedMs: number;
  remainingMs: number;
  startedAtMs?: number;
};

function assertNow(nowMs: number): void {
  if (!Number.isFinite(nowMs)) throw new RangeError("nowMs must be finite.");
}

function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be non-negative and finite.`);
}

export function createStopwatch(elapsedMs = 0): StopwatchState {
  assertNonNegative(elapsedMs, "elapsedMs");
  return { status: "idle", elapsedMs };
}

export function getStopwatchElapsed(state: StopwatchState, nowMs: number): number {
  assertNow(nowMs);
  if (state.status !== "running" || state.startedAtMs === undefined) return state.elapsedMs;
  return state.elapsedMs + Math.max(0, nowMs - state.startedAtMs);
}

export function startStopwatch(state: StopwatchState, nowMs: number): StopwatchState {
  assertNow(nowMs);
  if (state.status === "running") return { ...state };
  return { status: "running", elapsedMs: state.elapsedMs, startedAtMs: nowMs };
}

export function pauseStopwatch(state: StopwatchState, nowMs: number): StopwatchState {
  assertNow(nowMs);
  if (state.status !== "running") return { ...state };
  return { status: "paused", elapsedMs: getStopwatchElapsed(state, nowMs) };
}

export function resetStopwatch(): StopwatchState {
  return createStopwatch();
}

/** Whole non-negative hours, minutes, and seconds → milliseconds. */
export function durationFromHms(hours: number, minutes: number, seconds: number): number {
  const h = Number.isFinite(hours) && hours > 0 ? Math.floor(hours) : 0;
  const m = Number.isFinite(minutes) && minutes > 0 ? Math.floor(minutes) : 0;
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return h * 3_600_000 + m * 60_000 + s * 1_000;
}

export function createTimer(durationMs: number): TimerState {
  assertNonNegative(durationMs, "durationMs");
  return { status: "idle", durationMs, elapsedMs: 0, remainingMs: durationMs };
}

export function getTimerRemaining(state: TimerState, nowMs: number): number {
  assertNow(nowMs);
  if (state.status !== "running" || state.startedAtMs === undefined) return state.remainingMs;
  return Math.max(0, state.durationMs - state.elapsedMs - Math.max(0, nowMs - state.startedAtMs));
}

export function tickTimer(state: TimerState, nowMs: number): TimerState {
  const remainingMs = getTimerRemaining(state, nowMs);
  if (state.status !== "running") return { ...state, remainingMs };
  if (remainingMs === 0) return { ...state, status: "finished", elapsedMs: state.durationMs, remainingMs: 0, startedAtMs: undefined };
  return { ...state, remainingMs };
}

export function startTimer(state: TimerState, nowMs: number): TimerState {
  assertNow(nowMs);
  if (state.status === "finished" || state.remainingMs === 0) return { ...state, status: "finished", remainingMs: 0, elapsedMs: state.durationMs, startedAtMs: undefined };
  if (state.status === "running") return { ...state };
  return { ...state, status: "running", startedAtMs: nowMs };
}

export function pauseTimer(state: TimerState, nowMs: number): TimerState {
  assertNow(nowMs);
  if (state.status !== "running") return { ...state };
  const current = tickTimer(state, nowMs);
  if (current.status === "finished") return current;
  return { ...current, status: "paused", elapsedMs: state.durationMs - current.remainingMs, startedAtMs: undefined };
}

export function resetTimer(durationMs: number): TimerState {
  return createTimer(durationMs);
}
