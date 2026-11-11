"use client";
import { useSyncExternalStore } from "react";
import { readThemeChoice, THEME_CHOICE_EVENT, THEME_CONTEXT_KEY } from "./resolve";
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === THEME_CONTEXT_KEY || event.key === null) listener(); };
  window.addEventListener(THEME_CHOICE_EVENT, listener);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(THEME_CHOICE_EVENT, listener); window.removeEventListener("storage", storage); };
}
/** Intent can change while the resolved color remains identical (Light to
 * System). Subscribe to intent itself rather than relying on a theme repaint. */
export function useThemeChoice() {
  return useSyncExternalStore(subscribe, readThemeChoice, () => "system" as const);
}
