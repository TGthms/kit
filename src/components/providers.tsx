"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

// Must match next-themes' default storageKey ("theme"), since we don't
// override it below.
const THEME_STORAGE_KEY = "theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Manual light/dark choices apply immediately for the current visit,
      // but ResetToSystem (below) always resets the persisted value back to
      // "system" on load, so every fresh visit/reload starts from System
      // again regardless of what was picked last time.
      disableTransitionOnChange
    >
      <ResetToSystem />
      {children}
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  );
}

/**
 * Forces the theme back to "system" on every mount, overwriting whatever
 * was persisted from a previous manual light/dark pick. Manual switching
 * still works live during the current session (via ThemeToggle / Settings),
 * it just never survives a reload or new visit.
 */
function ResetToSystem() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Clear out any previously-persisted manual choice before anything
    // else can read it, then explicitly resync to system.
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, "system");
    } catch {
      // localStorage may be unavailable (e.g. private mode); ignore.
    }
    setTheme("system");
    // Intentionally run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
