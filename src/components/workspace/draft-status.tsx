"use client";
import { useTranslations } from "next-intl";
export function DraftStatus({ failed }: { failed: boolean }) {
  const t = useTranslations("workspace");
  return failed ? (
    <p role="alert" className="text-xs text-destructive">
      {t("storageFailed")}
    </p>
  ) : null;
}
