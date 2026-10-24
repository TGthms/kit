"use client";

import { useLocale, useTranslations } from "next-intl";
import { useHistoryStore } from "@/stores/history-store";
import { HeroButton } from "@/components/ui/hero-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ClearHistory() {
  const locale = useLocale();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const th = useTranslations("history");
  const clear = useHistoryStore((state) => state.clear);
  return <ConfirmDialog
    locale={locale}
    trigger={<HeroButton variant="danger">{t("clearHistory")}</HeroButton>}
    title={t("clearHistory")}
    description={th("clearConfirm")}
    cancelLabel={tc("cancel")}
    confirmLabel={t("clearHistory")}
    onConfirm={clear}
  />;
}
