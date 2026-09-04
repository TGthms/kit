import { describe, expect, it } from "vitest";
import {
  NEW_YEAR_COUNTDOWN_MS,
  countdownParts,
  getNewYearCardState,
  nextNewYearTickMs,
  newYearStart,
  shouldPlayNewYearFireworks,
} from "./new-year";

describe("new year card window", () => {
  it("targets local midnight of the incoming year from December", () => {
    const start = newYearStart(new Date(2026, 11, 31, 23, 50, 0));
    expect(start.getFullYear()).toBe(2027);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(newYearStart(new Date(2027, 0, 1, 8, 0, 0)).getFullYear()).toBe(2027);
  });

  it("stays hidden until ten minutes before midnight", () => {
    const early = getNewYearCardState(new Date(2026, 11, 31, 23, 49, 59, 999));
    expect(early.phase).toBe("hidden");
    expect(early.msLeft).toBeGreaterThan(NEW_YEAR_COUNTDOWN_MS);
    expect(getNewYearCardState(new Date(2026, 11, 31, 23, 50, 0, 0)).phase).toBe("countdown");
  });

  it("counts down through the last ten minutes", () => {
    const state = getNewYearCardState(new Date(2026, 11, 31, 23, 59, 3, 0));
    expect(state.phase).toBe("countdown");
    expect(state.year).toBe(2027);
    expect(state.msLeft).toBe(57_000);
    expect(countdownParts(state.msLeft)).toEqual({ minutes: 0, seconds: 57 });
    expect(shouldPlayNewYearFireworks(state)).toBe(false);
    expect(nextNewYearTickMs(state, new Date(2026, 11, 31, 23, 59, 3, 0))).toBe(250);
  });

  it("celebrates for the rest of 1 January and then hides", () => {
    const flip = getNewYearCardState(new Date(2027, 0, 1, 0, 0, 0, 0));
    expect(flip).toMatchObject({ phase: "celebrate", year: 2027, msLeft: 0, msSinceStart: 0 });
    expect(shouldPlayNewYearFireworks(flip)).toBe(true);
    const later = getNewYearCardState(new Date(2027, 0, 1, 0, 0, 10, 0));
    expect(later.phase).toBe("celebrate");
    expect(shouldPlayNewYearFireworks(later)).toBe(false);
    const noon = getNewYearCardState(new Date(2027, 0, 1, 12, 0, 0, 0));
    expect(noon.phase).toBe("celebrate");
    expect(shouldPlayNewYearFireworks(noon)).toBe(false);
    const nextDay = getNewYearCardState(new Date(2027, 0, 2, 0, 0, 0, 0));
    expect(nextDay.phase).toBe("hidden");
    const opening = getNewYearCardState(new Date(2027, 0, 1, 0, 0, 3, 0));
    expect(nextNewYearTickMs(opening, new Date(2027, 0, 1, 0, 0, 3, 0))).toBe(250);
    const afterShow = getNewYearCardState(new Date(2027, 0, 1, 0, 0, 11, 0));
    expect(nextNewYearTickMs(afterShow, new Date(2027, 0, 1, 0, 0, 11, 0))).toBeGreaterThan(1000);
  });

  it("wakes a hidden December tab at the ten-minute countdown, not the next greeting period", () => {
    const evening = new Date(2026, 11, 31, 22, 0, 0, 0);
    const hidden = getNewYearCardState(evening);
    expect(hidden.phase).toBe("hidden");
    expect(nextNewYearTickMs(hidden, evening)).toBe(2 * 60 * 60 * 1000 - NEW_YEAR_COUNTDOWN_MS);
    const justBefore = new Date(2026, 11, 31, 23, 49, 59, 999);
    expect(getNewYearCardState(justBefore).phase).toBe("hidden");
    expect(nextNewYearTickMs(getNewYearCardState(justBefore), justBefore)).toBe(50);
  });

  it("does not schedule a card tick after New Year's Day", () => {
    const midYear = new Date(2027, 5, 4, 12, 0, 0, 0);
    expect(getNewYearCardState(midYear).phase).toBe("hidden");
    expect(nextNewYearTickMs(getNewYearCardState(midYear), midYear)).toBe(0);
  });
});
