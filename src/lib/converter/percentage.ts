function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number.`);
}

/** `percent` percent of `whole` (e.g. 20% of 50 → 10). */
export function percentOf(percent: number, whole: number): number {
  assertFinite(percent, "percent");
  assertFinite(whole, "whole");
  return (whole * percent) / 100;
}

/** `part` as a percentage of `whole` (e.g. 10 of 50 → 20). */
export function whatPercent(part: number, whole: number): number {
  assertFinite(part, "part");
  assertFinite(whole, "whole");
  if (whole === 0) throw new RangeError("whole must not be zero.");
  return (part / whole) * 100;
}

/** Percent change from `from` to `to`. */
export function changePercent(from: number, to: number): number {
  assertFinite(from, "from");
  assertFinite(to, "to");
  if (from === 0) throw new RangeError("from must not be zero.");
  return ((to - from) / from) * 100;
}

/** Apply a percent change to `value` (e.g. 50 + 10% → 55). */
export function applyPercentChange(value: number, percent: number): number {
  assertFinite(value, "value");
  assertFinite(percent, "percent");
  return value * (1 + percent / 100);
}
