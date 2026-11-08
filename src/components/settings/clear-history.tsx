"use client";

import { lazy, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useHistoryStore } from "@/stores/history-store";
import { HeroButton } from "@/components/ui/hero-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GlassBoundary } from "@/components/ui/glass-boundary";
import { useLiquidGlassEnabled } from "@/lib/theme/liquid-glass";

const GlassClearHistory = lazy(() => import("./liquid-glass-settings").then((module) => ({ default: module.GlassClearHistory })));

export function ClearHistory() {
  const locale = useLocale();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const th = useTranslations("history");
  const clear = useHistoryStore((state) => state.clear);
  const glass = useLiquidGlassEnabled();
  const title = t("clearHistory");
  const description = th("clearConfirm");
  const cancelLabel = tc("cancel");
  const fallback = <ConfirmDialog
    locale={locale}
    trigger={<HeroButton variant="danger">{title}</HeroButton>}
    title={title}
    description={description}
    cancelLabel={cancelLabel}
    confirmLabel={title}
    onConfirm={clear}
  />;
  if (!glass || typeof HTMLDialogElement.prototype.showModal !== "function") return fallback;
  return (
    <GlassBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GlassClearHistory title={title} description={description} cancelLabel={cancelLabel} onConfirm={clear} />
      </Suspense>
    </GlassBoundary>
  );
}
