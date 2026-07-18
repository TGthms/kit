"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LocaleSwitcherVariant = "compact" | "settings";

/**
 * compact  — header/drawer: tight segmented control, width fits content
 * settings — settings page: same discrete buttons as Appearance
 */
export function LocaleSwitcher({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: LocaleSwitcherVariant;
}) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");

  const select = (l: Locale) => {
    try {
      localStorage.setItem("kit-locale", l);
    } catch {
      /* private mode */
    }
    router.replace(pathname, { locale: l });
  };

  if (variant === "settings") {
    return (
      <div
        className={cn("flex flex-wrap gap-2", className)}
        role="group"
        aria-label={t("language")}
      >
        {locales.map((l) => (
          <Button
            key={l}
            type="button"
            size="sm"
            variant={l === locale ? "default" : "outline"}
            className="transition-[background-color,color,box-shadow,transform] duration-200 ease-out"
            onClick={() => select(l)}
            aria-pressed={l === locale}
          >
            {localeNames[l]}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-full border border-border/50 bg-secondary/50 p-0.5",
        className
      )}
      role="group"
      aria-label={t("language")}
    >
      {locales.map((l) => (
        <Button
          key={l}
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 min-w-0 rounded-full px-2.5 text-[11px] font-medium sm:text-xs",
            "transition-[background-color,color,box-shadow,transform] duration-200 ease-out",
            l === locale
              ? "bg-background text-foreground shadow-sm hover:bg-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => select(l)}
          aria-pressed={l === locale}
        >
          {localeNames[l]}
        </Button>
      ))}
    </div>
  );
}
