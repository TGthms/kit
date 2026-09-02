"use client";

import { useEffect, useLayoutEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Toaster } from "sonner";
import { PressFeedback } from "@/components/layout/press-feedback";

type ThemeChoice = "system" | "light" | "dark";

export function rememberThemeChoice(choice: ThemeChoice, setTheme: (theme: ThemeChoice) => void) {
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
        disableTransitionOnChange
      >
        <ThemeColorSync />
        <PressFeedback />
        {children}
        <KitToaster />
      </ThemeProvider>
    </>
  );
}

function KitToaster() {
  const t = useTranslations("common");
  return (
    <Toaster
      position="top-center"
      offset="calc(3.75rem + env(safe-area-inset-top))"
      visibleToasts={3}
      duration={2800}
      gap={10}
      expand={false}
      closeButton
      swipeDirections={["top"]}
      toastOptions={{
        className: "kit-toast",
        closeButtonAriaLabel: t("close"),
      }}
    />
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


