"use client";

import { useEffect, useLayoutEffect } from "react";
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

export function Providers({
  children,
  lang,
  dir,
}: {
  children: React.ReactNode;
  lang?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <>
      <HtmlLang lang={lang} dir={dir} />
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
        <ThemeColorSync />
        {children}
        <Toaster
          position="top-center"
          offset="calc(3.75rem + env(safe-area-inset-top))"
          visibleToasts={3}
          duration={2800}
          gap={10}
          expand={false}
          toastOptions={{
            className: "kit-toast",
          }}
        />
      </ThemeProvider>
    </>
  );
}

function HtmlLang({ lang, dir }: { lang?: string; dir?: "ltr" | "rtl" }) {
  useLayoutEffect(() => {
    if (lang) document.documentElement.lang = lang;
    if (dir) document.documentElement.dir = dir;
  }, [dir, lang]);
  return null;
}

// Matches `--background` in globals.css (light/dark). Keep in sync with the
// inline pre-hydration script in src/app/layout.tsx, which sets the same
// values before first paint so the PWA/browser chrome color never flashes
// the wrong mode.
const THEME_COLOR = { light: "#f5f5f7", dark: "#000000" };

/**
 * Keeps <meta name="theme-color"> aligned with the actually-resolved theme
 * (which can be a manual override, not just the OS preference) so the
 * installed PWA's title/status bar always matches the app's own background
 * instead of a mismatched static color.
 */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", THEME_COLOR[resolvedTheme]);
  }, [resolvedTheme]);

  return null;
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
