"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex max-w-full flex-wrap items-center gap-0.5 rounded-full bg-secondary/60 p-0.5",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {locales.map((l) => (
        <Button
          key={l}
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 min-w-0 rounded-full px-2 text-[11px] font-medium sm:px-2.5 sm:text-xs",
            l === locale && "bg-card text-foreground shadow-sm hover:bg-card"
          )}
          onClick={() => {
            try {
              localStorage.setItem("kit-locale", l);
            } catch {
              /* private mode */
            }
            router.replace(pathname, { locale: l });
          }}
          aria-pressed={l === locale}
        >
          {localeNames[l]}
        </Button>
      ))}
    </div>
  );
}
