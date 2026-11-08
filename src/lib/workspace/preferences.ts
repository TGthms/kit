import { sanitizeFavoriteIds } from "@/stores/favorites-store";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { ThemeChoice } from "@/lib/theme/resolve";
import type { HapticMode } from "@/lib/feedback/haptics";
import { isGlassTransparency } from "@/lib/theme/glass-transparency";
export type Preferences = {
  kind: "kit-preferences";
  version: 1;
  locale: Locale;
  theme: ThemeChoice;
  favorites: string[];
  haptics: HapticMode;
  liquidGlass: boolean;
  glassTransparency?: number;
  showObservances: boolean;
  mathRecovery: boolean;
};
const KEYS = [
  "kind",
  "version",
  "locale",
  "theme",
  "favorites",
  "haptics",
  "liquidGlass",
  "glassTransparency",
  "showObservances",
  "mathRecovery",
];
/** Never imports storage keys, functions, history, file contents or permissions. */
export function parsePreferences(text: string): Preferences {
  if (text.length > 20000) throw new Error("invalid");
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid");
  const p = value as Record<string, unknown>;
  if (
    Object.keys(p).some((key) => !KEYS.includes(key)) ||
    p.kind !== "kit-preferences" ||
    p.version !== 1 ||
    typeof p.locale !== "string" ||
    !isLocale(p.locale) ||
    !["system", "light", "dark"].includes(p.theme as string) ||
    !["full", "reduced", "off"].includes(p.haptics as string) ||
    !Array.isArray(p.favorites) ||
    p.favorites.length > 100 ||
    p.favorites.some((id) => typeof id !== "string") ||
    ("glassTransparency" in p && !isGlassTransparency(p.glassTransparency)) ||
    [p.liquidGlass, p.showObservances, p.mathRecovery].some(
      (value) => typeof value !== "boolean",
    )
  )
    throw new Error("invalid");
  const favorites = sanitizeFavoriteIds(p.favorites);
  if (favorites.length !== p.favorites.length) throw new Error("invalid");
  return {
    kind: "kit-preferences",
    version: 1,
    locale: p.locale,
    theme: p.theme as ThemeChoice,
    favorites,
    haptics: p.haptics as HapticMode,
    liquidGlass: p.liquidGlass as boolean,
    ...(isGlassTransparency(p.glassTransparency)
      ? { glassTransparency: p.glassTransparency }
      : {}),
    showObservances: p.showObservances as boolean,
    mathRecovery: p.mathRecovery as boolean,
  };
}
