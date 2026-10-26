"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/react/hydrated";
import { checkForAppUpdate, type UpdateCheck } from "@/lib/pwa/check-update";
import { OFFER_UPDATE_EVENT } from "@/lib/pwa/update-notice";
import { APP_VERSION } from "@/lib/version";

export function CheckUpdates() {
  const t = useTranslations("settings");
  const hydrated = useHydrated();
  const request = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<UpdateCheck | "checking" | "error" | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const check = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus("checking");
    try {
      const result = await checkForAppUpdate(controller.signal);
      if (controller.signal.aborted) return;
      setStatus(result);
      // Reuse the shell's single Update action, progress, retry and reload flow.
      if (result === "available") window.dispatchEvent(new Event(OFFER_UPDATE_EVENT));
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    } finally {
      if (request.current === controller) request.current = null;
    }
  };
  const message = status === "current" ? t("updateCurrent")
    : status === "available" ? t("updateAvailable")
      : status === "preparing" ? t("updatePreparing")
        : status === "unavailable" ? t("updateCheckUnavailable")
          : status === "error" ? t("updateCheckFailed") : "";
  return (
    <div className="space-y-3 pb-4 text-center">
      <p className="type-caption text-muted-foreground">{t("version")} {APP_VERSION}</p>
      <Button variant="outline" size="sm" onClick={check} disabled={!hydrated || status === "checking"}>
        {status === "checking" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
        {status === "checking" ? t("updateChecking") : t("checkUpdates")}
      </Button>
      <p role="status" className="type-caption text-muted-foreground">{message}</p>
    </div>
  );
}
