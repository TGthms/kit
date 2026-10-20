// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useLiquidGlassEnabled } from "./liquid-glass";

beforeEach(() => {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(navigator, "gpu", { configurable: true, value: {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  useAppearanceStore.setState({ liquidGlass: true });
});
afterEach(() => {
  cleanup();
  useAppearanceStore.setState({ liquidGlass: false });
  Reflect.deleteProperty(window, "isSecureContext");
  Reflect.deleteProperty(navigator, "gpu");
  vi.unstubAllGlobals();
});

it("requires opt-in, a secure context, and WebGPU", () => {
  const { result, rerender } = renderHook(useLiquidGlassEnabled);
  expect(result.current).toBe(true);
  Reflect.deleteProperty(navigator, "gpu"); rerender();
  expect(result.current).toBe(false);
  Object.defineProperty(navigator, "gpu", { configurable: true, value: {} });
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: false }); rerender();
  expect(result.current).toBe(false);
});

it.each(["reduced-transparency", "forced-colors", "prefers-contrast"])("uses standard controls for %s", (preference) => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes(preference), addEventListener() {}, removeEventListener() {} }));
  expect(renderHook(useLiquidGlassEnabled).result.current).toBe(false);
});
