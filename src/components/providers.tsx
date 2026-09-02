"use client";

import { useEffect, useLayoutEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Toaster } from "sonner";
import { PressFeedback } from "@/components/layout/press-feedback";
import { THEME_COLOR } from "@/lib/theme/circular-transition";
import { currentSystemTheme, msUntilNextNightBoundary, syncAppliedTheme } from "@/lib/theme/resolve";

export { rememberThemeChoice } from "@/lib/theme/resolve";

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
        <ThemePreferenceSync />
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

/**
 * Re-applies the Kit auto theme policy when the OS appearance changes or the
 * local clock crosses 22:00 / 05:00. A live Light/Dark tap is not blocked;
 * this only runs on those automatic events. User intent stays in
 * kit-theme-context; next-themes stores the value that should actually paint.
 */
function ThemePreferenceSync() {
  const { setTheme } = useTheme();

  useLayoutEffect(() => {
    const run = () => syncAppliedTheme(setTheme, new Date(), currentSystemTheme());
    run();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => run();
    let unsubscribeMedia = () => {};
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onSystem);
      unsubscribeMedia = () => media.removeEventListener("change", onSystem);
    } else {
      media.addListener(onSystem);
      unsubscribeMedia = () => media.removeListener(onSystem);
    }

    let timer = 0;
    const arm = () => {
      timer = window.setTimeout(() => {
        run();
        arm();
      }, msUntilNextNightBoundary(new Date()));
    };
    arm();

    return () => {
      unsubscribeMedia();
      window.clearTimeout(timer);
    };
  }, [setTheme]);

  return null;
}

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
