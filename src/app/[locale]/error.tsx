"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="type-display text-3xl">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("body")}</p>
      <Button className="mt-6" onClick={() => reset()}>
        {t("retry")}
      </Button>
    </div>
  );
}
