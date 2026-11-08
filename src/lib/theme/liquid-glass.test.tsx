// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useLiquidGlassEnabled } from "./liquid-glass";

function provider(locale = "en") {
  return function Provider({ children }: { children: ReactNode }) {
    return <NextIntlClientProvider locale={locale} messages={{}}>{children}</NextIntlClientProvider>;
  };
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {});
  vi.stubGlobal("CSS", { supports: () => true });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  useAppearanceStore.setState({ liquidGlass: true });
});
afterEach(() => {
  cleanup();
  useAppearanceStore.setState({ liquidGlass: false });
  vi.unstubAllGlobals();
});

it("works without WebGPU and uses the stable controls without backdrop blur or opt-in", () => {
  const { result, rerender } = renderHook(useLiquidGlassEnabled, { wrapper: provider() });
  expect(result.current).toBe(true);
  vi.stubGlobal("CSS", { supports: (property: string) => !property.endsWith("backdrop-filter") });
  rerender();
  expect(result.current).toBe(false);
  vi.stubGlobal("CSS", { supports: () => true });
  useAppearanceStore.setState({ liquidGlass: false });
  rerender();
  expect(result.current).toBe(false);
});

it.each(["reduced-transparency", "forced-colors", "prefers-contrast"])("uses standard controls for %s", (preference) => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes(preference), addEventListener() {}, removeEventListener() {} }));
  expect(renderHook(useLiquidGlassEnabled, { wrapper: provider() }).result.current).toBe(false);
});

it("preserves the mirrored controls in RTL locales", () => {
  expect(renderHook(useLiquidGlassEnabled, { wrapper: provider("ar") }).result.current).toBe(false);
});
