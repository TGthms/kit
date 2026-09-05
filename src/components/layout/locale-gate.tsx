"use client";

import { useEffect } from "react";
import { detectLocale, isLocale, localeNames, locales, resolveLocale } from "@/lib/i18n/config";
import { withAsset, withBasePath } from "@/lib/base-path";
import { withSearchAndHash } from "@/lib/navigation/html-path";
import { SITE_NAME } from "@/lib/seo/site";

const TAGLINE = "Everyday tools in your browser. Private by design.";

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
    const dest = withSearchAndHash(
      withBasePath(`/${locale}/`),
      window.location.search,
      window.location.hash,
    );
    window.location.replace(dest);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withAsset("/icons/icon.svg")}
        alt={SITE_NAME}
        width={64}
        height={64}
        className="h-16 w-16 rounded-[14px] shadow-sm"
        draggable={false}
      />
      <div className="space-y-2">
        <h1 className="type-display text-3xl text-foreground">{SITE_NAME}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{TAGLINE}</p>
      </div>
      <span className="kit-spinner" aria-hidden />
      <p className="sr-only" role="status">
        Loading
      </p>
      <noscript>
        <nav aria-label="Languages" className="mt-4 max-w-md text-sm text-muted-foreground">
          <p className="mb-3">{TAGLINE}</p>
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {locales.map((locale) => (
              <li key={locale}>
                <a href={withBasePath(`/${locale}/`)} className="underline-offset-2 hover:underline">
                  {localeNames[locale]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </noscript>
    </div>
  );
}
