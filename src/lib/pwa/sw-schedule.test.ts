import { describe, expect, it } from "vitest";
import {
  UPDATE_AFTER_VISIBLE_MS,
  UPDATE_EVERY_MS,
  shouldCheckForUpdate,
  shouldSkipHeavyFill,
} from "./sw-schedule";

describe("shouldSkipHeavyFill", () => {
  it("skips for data saver and 2G connections", () => {
    expect(shouldSkipHeavyFill({ saveData: true })).toBe(true);
    expect(shouldSkipHeavyFill({ effectiveType: "slow-2g" })).toBe(true);
    expect(shouldSkipHeavyFill({ effectiveType: "2g" })).toBe(true);
  });

  it("fills for faster connections and unknown state", () => {
    expect(shouldSkipHeavyFill({ effectiveType: "3g" })).toBe(false);
    expect(shouldSkipHeavyFill({ effectiveType: "4g" })).toBe(false);
    expect(shouldSkipHeavyFill({})).toBe(false);
    expect(shouldSkipHeavyFill(undefined)).toBe(false);
  });

  it("data saver wins over a fast effectiveType", () => {
    expect(shouldSkipHeavyFill({ saveData: true, effectiveType: "4g" })).toBe(true);
  });
});

describe("shouldCheckForUpdate", () => {
  it("blocks checks inside the throttle window", () => {
    expect(shouldCheckForUpdate(0, 0)).toBe(false);
    expect(shouldCheckForUpdate(UPDATE_EVERY_MS - 1, 0)).toBe(false);
    expect(shouldCheckForUpdate(UPDATE_EVERY_MS, 0)).toBe(true);
  });

  it("uses wall-clock distance, not magnitude", () => {
    const now = 10 * UPDATE_EVERY_MS;
    expect(shouldCheckForUpdate(now, now - 1)).toBe(false);
    expect(shouldCheckForUpdate(now, now - UPDATE_EVERY_MS)).toBe(true);
  });
});

describe("scheduling constants", () => {
  it("keep the visible-check delay inside the throttle window", () => {
    expect(UPDATE_AFTER_VISIBLE_MS).toBeLessThan(UPDATE_EVERY_MS);
  });
});
