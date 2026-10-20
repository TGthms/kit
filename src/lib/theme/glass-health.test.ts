// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GLASS_READY_TIMEOUT_MS, useGlassHealth } from "./glass-health";

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("falls back if tab materials never become ready", () => {
  const { result } = renderHook(() => useGlassHealth(true));
  act(() => vi.advanceTimersByTime(GLASS_READY_TIMEOUT_MS));
  expect(result.current.failed).toBe(true);
});

it("cancels the startup deadline once both tab maps are ready", () => {
  const { result } = renderHook(() => useGlassHealth(true));
  act(() => result.current.onDiagnostic({ surfaces: 2, maps: 2, mapTime: 12 }));
  act(() => vi.advanceTimersByTime(GLASS_READY_TIMEOUT_MS * 2));
  expect(result.current.failed).toBe(false);
});

it("does not time out an idle switch, but catches a stalled pressed lens", () => {
  const { result } = renderHook(useGlassHealth);
  act(() => result.current.onDiagnostic({ surfaces: 0, maps: 0, mapTime: 0 }));
  act(() => vi.advanceTimersByTime(GLASS_READY_TIMEOUT_MS * 2));
  expect(result.current.failed).toBe(false);
  act(() => result.current.onDiagnostic({ surfaces: 1, maps: 0, mapTime: 0 }));
  act(() => vi.advanceTimersByTime(GLASS_READY_TIMEOUT_MS));
  expect(result.current.failed).toBe(true);
});

it("restores ordinary controls on a device or shader error", () => {
  const { result } = renderHook(useGlassHealth);
  act(() => result.current.onDiagnostic({ error: new Error("Device lost"), surfaces: 1, maps: 0, mapTime: 0 }));
  expect(result.current.failed).toBe(true);
});

it("clears pending work when a scene is removed", () => {
  const { unmount } = renderHook(() => useGlassHealth(true));
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
