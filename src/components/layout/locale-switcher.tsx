"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, localeNames, resolveLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type LocaleSwitcherVariant = "compact" | "settings";

/**
 * Native language picker listing every first-class locale.
 * Settings uses a full-width select; header chrome uses a compact select.
 */
export function LocaleSwitcher({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: LocaleSwitcherVariant;
}) {
  const pathLocale = useLocale();
  const locale = resolveLocale(pathLocale);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");

  const select = (l: Locale) => {
    if (l === locale) return;
    try {
      localStorage.setItem("kit-locale", l);
    } catch {
      /* private mode */
    }
    router.replace(pathname, { locale: l });
  };

  return (
    <select
      aria-label={t("language")}
      className={cn(
        "rounded-xl border border-input bg-background text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "settings"
          ? "h-11 w-full max-w-md px-3"
          : "h-9 max-w-[11rem] px-2 text-xs sm:text-sm",
        className
      )}
      value={locale}
      onChange={(e) => select(e.target.value as Locale)}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
