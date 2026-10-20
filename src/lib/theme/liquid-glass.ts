"use client";

import { useSyncExternalStore } from "react";
import { useAppearanceStore } from "@/stores/appearance-store";

const fallbackPreferences = ["(prefers-reduced-transparency: reduce)", "(forced-colors: active)", "(prefers-contrast: more)"];

function supported(): boolean {
  return window.isSecureContext && "gpu" in navigator && !fallbackPreferences.some((query) => window.matchMedia(query).matches);
}

function subscribe(listener: () => void): () => void {
  const queries = fallbackPreferences.map((query) => window.matchMedia(query));
  queries.forEach((query) => query.addEventListener("change", listener));
  return () => queries.forEach((query) => query.removeEventListener("change", listener));
}

/** Do not download or initialize the SDK until it is opted into and supported. */
export function useLiquidGlassEnabled(): boolean {
  const enabled = useAppearanceStore((state) => state.liquidGlass);
  const available = useSyncExternalStore(subscribe, supported, () => false);
  return enabled && available;
}
