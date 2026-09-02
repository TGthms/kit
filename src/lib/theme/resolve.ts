/**
 * Kit theme policy:
 *
 * - Default is System.
 * - OS light + daytime: a manual Light or Dark choice is honored.
 * - OS dark, or local night (22:00–04:59, same window as the home greeting):
 *   follow System (dark when the OS is dark); keep a Dark choice; force Dark
 *   even if the user picked Light.
 *
 * User intent is stored in `kit-theme-context`. next-themes' `theme` key holds
 * the value that should actually be applied, so its blocking script cannot
 * undo a night/OS-dark force after `public/boot/theme.js` runs.
 *
 * Keep `public/boot/theme.js` in sync with this file.
 */

export type ThemeChoice = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type ThemeContext = {
  choice: ThemeChoice;
  system: ResolvedTheme;
};

export const THEME_STORAGE_KEY = "theme";
export const THEME_CONTEXT_KEY = "kit-theme-context";

/** Inclusive start of the night force window (local hour). */
export const NIGHT_START_HOUR = 22;
/** Exclusive end of the night force window (local hour). */
export const NIGHT_END_HOUR = 5;

export function isNightHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

export function shouldForceDark(system: ResolvedTheme, date: Date): boolean {
  return system === "dark" || isNightHour(date);
}

/**
 * Value to write to next-themes' `theme` key.
 *
 * When the OS is already dark and the user has not picked Light, keep
 * `"system"` so a later daytime OS-light switch still follows the OS.
 * Night with OS light cannot use `"system"` (that would resolve to light).
 */
export function nextThemesValue(choice: ThemeChoice, system: ResolvedTheme, date: Date): ThemeChoice {
  if (shouldForceDark(system, date)) {
    if (choice === "system" && system === "dark") return "system";
    return "dark";
  }
  return choice;
}

export function resolveKitTheme(choice: ThemeChoice, system: ResolvedTheme, date: Date): ResolvedTheme {
  const applied = nextThemesValue(choice, system, date);
  return applied === "system" ? system : applied;
}

export function msUntilNextNightBoundary(now: Date): number {
  const next = new Date(now.getTime());
  const hour = now.getHours();
  if (hour >= NIGHT_START_HOUR) {
    next.setDate(next.getDate() + 1);
    next.setHours(NIGHT_END_HOUR, 0, 0, 0);
  } else if (hour < NIGHT_END_HOUR) {
    next.setHours(NIGHT_END_HOUR, 0, 0, 0);
  } else {
    next.setHours(NIGHT_START_HOUR, 0, 0, 0);
  }
  return Math.max(1, next.getTime() - now.getTime());
}

export function parseThemeChoice(value: string | null | undefined): ThemeChoice | null {
  if (value === "system" || value === "light" || value === "dark") return value;
  return null;
}

export function currentSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    return parseThemeChoice(window.localStorage.getItem(THEME_STORAGE_KEY)) ?? "system";
  } catch {
    return "system";
  }
}

export function readThemeContext(): ThemeContext | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(THEME_CONTEXT_KEY) ?? "null") as {
      choice?: unknown;
      system?: unknown;
    } | null;
    const choice = parseThemeChoice(typeof parsed?.choice === "string" ? parsed.choice : null);
    if (!choice) return null;
    const system: ResolvedTheme = parsed?.system === "dark" ? "dark" : "light";
    return { choice, system };
  } catch {
    return null;
  }
}

export function writeThemeContext(context: ThemeContext) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_CONTEXT_KEY, JSON.stringify(context));
  } catch {
    /* localStorage may be unavailable */
  }
}

/**
 * Seed intent from the current next-themes value once, so a Light/Dark pick
 * made before context existed is not treated as System.
 */
export function seedThemeContextIfMissing(system: ResolvedTheme): ThemeChoice {
  const existing = readThemeContext();
  if (existing) return existing.choice;
  const choice = readStoredTheme();
  writeThemeContext({ choice, system });
  return choice;
}

export function readThemeChoice(): ThemeChoice {
  return readThemeContext()?.choice ?? readStoredTheme();
}

export function rememberThemeChoice(
  choice: ThemeChoice,
  setTheme: (theme: string) => void,
  date = new Date(),
  system = currentSystemTheme(),
) {
  writeThemeContext({ choice, system });
  setTheme(nextThemesValue(choice, system, date));
}

export function syncAppliedTheme(
  setTheme: (theme: string) => void,
  date = new Date(),
  system = currentSystemTheme(),
) {
  seedThemeContextIfMissing(system);
  setTheme(nextThemesValue(readThemeChoice(), system, date));
}
