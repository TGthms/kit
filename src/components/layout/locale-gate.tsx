"use client";

import { useEffect } from "react";
import { detectLocale, isLocale, resolveLocale } from "@/lib/i18n/config";
import { withBasePath } from "@/lib/base-path";

/** First-visit language pick for the static `/` entry. */
export function LocaleGate() {
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("kit-locale");
    } catch {
      stored = null;
    }
    const locale =
      stored && (isLocale(stored) || stored === "zh")
        ? resolveLocale(stored)
        : detectLocale(navigator.language || navigator.languages?.[0]);
    const dest = withBasePath(`/${locale}/`);
    window.location.replace(dest);
  }, []);

  return (
    <p className="p-6 text-sm text-muted-foreground" role="status">
      …
    </p>
  );
}
