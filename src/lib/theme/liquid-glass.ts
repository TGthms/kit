"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { localeDir } from "@/lib/i18n/config";
import { useAppearanceStore } from "@/stores/appearance-store";

const fallbackPreferences = ["(prefers-reduced-transparency: reduce)", "(forced-colors: active)", "(prefers-contrast: more)"];

function supported(): boolean {
  const css = window.CSS;
  return typeof ResizeObserver === "function"
    && typeof window.matchMedia === "function"
    && !!css?.supports("color", "color-mix(in srgb, black, white)")
    && css.supports("width", "1cqi")
    && (css.supports("backdrop-filter", "blur(1px)") || css.supports("-webkit-backdrop-filter", "blur(1px)"))
    && !fallbackPreferences.some((query) => window.matchMedia(query).matches);
}

function subscribe(listener: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const queries = fallbackPreferences.map((query) => window.matchMedia(query));
  queries.forEach((query) => query.addEventListener("change", listener));
  return () => queries.forEach((query) => query.removeEventListener("change", listener));
}

const unavailable = () => false;
const noSubscription = () => () => {};

/** Use Classic during prerendering and whenever the glass controls are unavailable. */
export function useLiquidGlassEnabled(): boolean {
  // This release of the library measures its drag gestures from the
  // physical left. Keep Kit's mirrored controls in right-to-left locales.
  const ltr = localeDir(useLocale()) === "ltr";
  const enabled = useAppearanceStore((state) => state.liquidGlass);
  return useSyncExternalStore(
    enabled && ltr ? subscribe : noSubscription,
    enabled && ltr ? supported : unavailable,
    unavailable,
  );
}

/** Scope the package's theme and tuning to the glass controls. */
export function useGlassMaterial() {
  const { resolvedTheme } = useTheme();
  const transparency = useAppearanceStore((state) => state.glassTransparency);
  return {
    "data-theme": resolvedTheme === "dark" ? "dark" : "light",
    style: { "--kit-glass-transparency": transparency / 100 } as CSSProperties,
  };
}
