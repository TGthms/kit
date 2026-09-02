"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rememberThemeChoice } from "@/lib/theme/resolve";
import { useHydrated } from "@/lib/react/hydrated";
import { runCircularThemeTransition } from "@/lib/theme/circular-transition";

/**
 * Header control: toggles between light and dark only.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme, systemTheme } = useTheme();
  const t = useTranslations("common");
  const hydrated = useHydrated();

  if (!hydrated) {
    return <div className="h-10 w-10 shrink-0" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={(event) => {
        const next = isDark ? "light" : "dark";
        const system = systemTheme === "dark" ? "dark" : "light";
        runCircularThemeTransition(next, () => rememberThemeChoice(next, setTheme, system), event);
      }}
      aria-label={isDark ? t("themeLight") : t("themeDark")}
      title={isDark ? t("themeLight") : t("themeDark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
