// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { countdownParts, getNewYearCardState } from "@/lib/home/new-year";
import { useLiveNewYearState } from "./use-live-new-year";

afterEach(() => {
  vi.useRealTimers();
});

describe("useLiveNewYearState", () => {
  it("advances the countdown while the parent snapshot stays frozen", () => {
    vi.useFakeTimers();
    const origin = new Date(2026, 11, 31, 23, 59, 0, 0).getTime();
    let offset = 0;
    const parent = getNewYearCardState(new Date(origin));
    expect(countdownParts(parent.msLeft)).toEqual({ minutes: 1, seconds: 0 });

    const { result } = renderHook(() => useLiveNewYearState(parent, () => new Date(origin + offset)));
    expect(countdownParts(result.current.msLeft)).toEqual({ minutes: 1, seconds: 0 });

    offset = 5_000;
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(parent.msLeft).toBe(60_000);
    expect(countdownParts(result.current.msLeft)).toEqual({ minutes: 0, seconds: 55 });
  });
});
