"use client";

import { useEffect } from "react";
import { detectLocale, isLocale, resolveLocale } from "@/lib/i18n/config";
import { withAsset, withBasePath } from "@/lib/base-path";

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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withAsset("/icons/icon.svg")}
        alt=""
        width={64}
        height={64}
        className="h-16 w-16 rounded-[14px] shadow-sm"
        draggable={false}
      />
      <span className="kit-spinner" aria-hidden />
      <p className="sr-only" role="status">
        Loading
      </p>
    </div>
  );
}
