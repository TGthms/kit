"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Manual light/dark choices apply immediately, but SystemThemeSync
      // (below) snaps back to "system" whenever the OS preference actually
      // changes, so a manual pick never gets stuck once the real system
      // setting flips (e.g. macOS auto dark mode at night).
      disableTransitionOnChange
    >
      <SystemThemeSync />
      {children}
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  );
}

/**
 * Listens for the OS's actual light/dark preference changing and forces
 * the app back to "system" mode when it does. This overrides any manual
 * light/dark choice the user made earlier, so the app always tracks the
 * real system setting once it changes — it just doesn't fight the user
 * in between OS-level flips.
 *
 * Uses the legacy addListener/removeListener API as a fallback for older
 * Safari (<14), which doesn't support addEventListener on MediaQueryList.
 */
function SystemThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => setTheme("system");

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleSystemChange);
      return () => mql.removeEventListener("change", handleSystemChange);
    }

    // Legacy Safari fallback.
    mql.addListener(handleSystemChange);
    return () => mql.removeListener(handleSystemChange);
  }, [setTheme]);

  return null;
}
