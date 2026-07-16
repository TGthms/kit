"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-1">
      {locales.map((l) => (
        <Button
          key={l}
          size="sm"
          variant={l === locale ? "default" : "ghost"}
          className="h-8 px-2.5 text-xs"
          onClick={() => {
            localStorage.setItem("kit-locale", l);
            router.replace(pathname, { locale: l });
          }}
        >
          {localeNames[l]}
        </Button>
      ))}
    </div>
  );
}
