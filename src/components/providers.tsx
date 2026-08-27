"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

// Must match next-themes' default storageKey ("theme"), since we don't
// override it below.
const THEME_STORAGE_KEY = "theme";
const THEME_CONTEXT_KEY = "kit-theme-context";
type ThemeChoice = "system" | "light" | "dark";

export function rememberThemeChoice(choice: ThemeChoice, setTheme: (theme: ThemeChoice) => void) {
  try {
    localStorage.setItem(THEME_CONTEXT_KEY, JSON.stringify({
      choice,
      system: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    }));
  } catch { /* localStorage may be unavailable. */ }
  setTheme(choice);
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // System is the initial preference; manual choices persist unless the
      // user selected light while the system was light and the system later
      // changes to dark.
      disableTransitionOnChange
    >
      <ThemePreferenceSync />
      {children}
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  );
}

function ThemePreferenceSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const sync = () => {
      try {
        const choice = window.localStorage.getItem(THEME_STORAGE_KEY);
        const context = JSON.parse(window.localStorage.getItem(THEME_CONTEXT_KEY) ?? "null") as { choice?: ThemeChoice; system?: "light" | "dark" } | null;
        const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        if (choice === "light" && context?.choice === "light" && context.system !== system) {
          rememberThemeChoice("system", setTheme);
        }
      } catch {
        // localStorage or matchMedia may be unavailable; next-themes still handles the theme.
      }
    };
    sync();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, [setTheme]);

  return null;
}
