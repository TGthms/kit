import { useFavoritesStore } from "@/stores/favorites-store";
import { useFeedbackStore } from "@/stores/feedback-store";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useGreetingPreferencesStore } from "@/stores/greeting-preferences-store";
import {
  DRAFT_ENABLED_KEY,
  DRAFT_EVENT,
  MATH_DRAFT_KEYS,
  draftKey,
} from "./math";
import { parsePreferences, type Preferences } from "./preferences";
import { THEME_CONTEXT_KEY, THEME_STORAGE_KEY } from "@/lib/theme/resolve";
/** Stage and verify the fixed storage envelope before updating any live stores.
 * Roll back writes if storage fills or becomes unavailable during the import. */
export function importPreferences(input: Preferences) {
  const p = parsePreferences(JSON.stringify(input));
  const entries: Record<string, string | null> = {
    "kit-favorites": JSON.stringify({
      state: { ids: p.favorites },
      version: 1,
    }),
    "kit-feedback": JSON.stringify({
      state: { haptics: p.haptics },
      version: 0,
    }),
    "kit-appearance": JSON.stringify({
      state: { liquidGlass: p.liquidGlass },
      version: 0,
    }),
    "kit-greeting-preferences": JSON.stringify({
      state: { showObservances: p.showObservances },
      version: 0,
    }),
    [DRAFT_ENABLED_KEY]: String(p.mathRecovery),
    "kit-locale": p.locale,
    [THEME_STORAGE_KEY]: p.theme,
    [THEME_CONTEXT_KEY]: JSON.stringify({
      choice: p.theme,
      system: window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    }),
  };
  if (!p.mathRecovery)
    for (const key of MATH_DRAFT_KEYS) entries[draftKey(key)] = null;
  const prior = Object.fromEntries(
    Object.keys(entries).map((key) => [key, localStorage.getItem(key)]),
  );
  try {
    for (const [key, value] of Object.entries(entries)) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      if (localStorage.getItem(key) !== value) throw new Error("storage");
    }
  } catch (error) {
    for (const [key, value] of Object.entries(prior)) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        /* storage is unavailable; do not publish partial live state */
      }
    }
    throw error;
  }
  void useFavoritesStore.persist.rehydrate();
  void useFeedbackStore.persist.rehydrate();
  void useAppearanceStore.persist.rehydrate();
  void useGreetingPreferencesStore.persist.rehydrate();
  window.dispatchEvent(new Event(DRAFT_EVENT));
}
