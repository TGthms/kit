"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { isChunkLoadError, reloadForStaleChunk } from "@/lib/pwa/chunk-load";

export default function ToolError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  const staleChunk = isChunkLoadError(error);

  useEffect(() => {
    if (staleChunk) reloadForStaleChunk();
  }, [staleChunk]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("body")}</p>
      <Button className="mt-6" onClick={() => (staleChunk ? reloadForStaleChunk(true) : reset())}>
        {t("retry")}
      </Button>
    </div>
  );
}
