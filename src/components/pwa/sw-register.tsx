"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/lib/i18n/navigation";
import { observeWaitingWorker } from "@/lib/pwa/update-notice";
import { withBasePath } from "@/lib/base-path";
import {
  FILL_AFTER_IDLE_MS,
  FILL_RESUME_MS,
  UPDATE_AFTER_VISIBLE_MS,
  shouldCheckForUpdate,
  shouldSkipHeavyFill,
} from "@/lib/pwa/sw-schedule";

export function ServiceWorkerRegister() {
  const locale = useLocale();
  const t = useTranslations("settings");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${base}/sw.js`;
    // A development server has no generated precache manifest. Do not let a
    // previously installed Kit worker serve stale shell/CSS during hot reload.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistration(`${window.location.origin}${base}/`).then((registration) => {
        const worker = registration?.active ?? registration?.waiting ?? registration?.installing;
        if (worker?.scriptURL === `${window.location.origin}${swUrl}`) void registration?.unregister();
      }).catch(() => undefined);
      return;
    }
    const homeUrl = `${window.location.origin}${withBasePath(`/${locale}/`)}`;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const skipHeavy = shouldSkipHeavyFill(connection);
    const post = (worker: ServiceWorker | null, message: Record<string, unknown>) => {
      worker?.postMessage(message);
    };
    const precacheHome = (worker: ServiceWorker | null) => {
      post(worker, { type: "PRECACHE_HOME", url: homeUrl });
    };
    const startFill = (worker: ServiceWorker | null) => {
      post(worker, { type: "PRECACHE_LOCALE", locale, skipHeavy });
    };
    let registration: ServiceWorkerRegistration | null = null;
    let disposed = false;
    let stopUpdateNotice = () => {};
    const offerUpdate = () => {
      // This page already presents the update in context, alongside its status.
      if (/\/settings\/offline\/?$/u.test(window.location.pathname)) return;
      toast(t("updateAvailable"), {
        id: "kit-update-ready",
        duration: Infinity,
        action: { label: t("reviewUpdate"), onClick: () => {
          toast.dismiss("kit-update-ready");
          router.push("/settings/offline");
        } },
      });
    };
    let lastUpdateAt = 0;
    let visibleTimer = 0;
    let fillTimer = 0;
    let resumeTimer = 0;

    const update = () => {
      visibleTimer = 0;
      if (!registration) return;
      const now = Date.now();
      if (!shouldCheckForUpdate(now, lastUpdateAt)) return;
      lastUpdateAt = now;
      registration.update().catch(() => undefined);
    };

    const scheduleUpdate = () => {
      window.clearTimeout(visibleTimer);
      visibleTimer = window.setTimeout(update, UPDATE_AFTER_VISIBLE_MS);
    };

    const onVisible = () => {
      window.clearTimeout(visibleTimer);
      visibleTimer = 0;
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(resumeTimer);
      post(activeWorker(), { type: "PRECACHE_PAUSE" });
      post(activeWorker(), { type: "PING" });
      try {
        const path = window.location.pathname.endsWith("/") ? window.location.pathname : `${window.location.pathname}/`;
        fetch(`${window.location.origin}${path}index.txt`, { headers: { RSC: "1" }, cache: "reload" }).catch(() => undefined);
      } catch {
        /* ignore */
      }
      // Wait out the first click after resume so update() does not race it.
      scheduleUpdate();
    };

    const onClick = () => {
      if (!visibleTimer) return;
      scheduleUpdate();
    };

    const activeWorker = () => registration?.active ?? null;

    const pauseFill = () => {
      window.clearTimeout(resumeTimer);
      post(activeWorker(), { type: "PRECACHE_PAUSE" });
      resumeTimer = window.setTimeout(() => post(activeWorker(), { type: "PRECACHE_RESUME" }), FILL_RESUME_MS);
    };

    const onInteract = () => pauseFill();

    const onHidden = () => {
      if (document.visibilityState !== "hidden") return;
      window.clearTimeout(resumeTimer);
      post(activeWorker(), { type: "PRECACHE_RESUME" });
    };

    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("visibilitychange", onHidden);
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onInteract, { capture: true, passive: true });
    document.addEventListener("keydown", onInteract, { capture: true, passive: true });
    document.addEventListener("wheel", onInteract, { capture: true, passive: true });
    document.addEventListener("touchstart", onInteract, { capture: true, passive: true });

    navigator.serviceWorker
      .register(swUrl, { updateViaCache: "none" })
      .then((reg) => {
        if (disposed) return;
        registration = reg;
        stopUpdateNotice = observeWaitingWorker(reg, offerUpdate);
        lastUpdateAt = Date.now();
        precacheHome(reg.active);
        navigator.serviceWorker.ready.then((ready) => {
          if (disposed) return;
          precacheHome(ready.active);
          window.clearTimeout(fillTimer);
          fillTimer = window.setTimeout(() => startFill(ready.active), FILL_AFTER_IDLE_MS);
        });
        return reg.update();
      })
      .catch(() => {
        /* ignore offline registration failures in dev */
      });

    return () => {
      disposed = true;
      stopUpdateNotice();
      toast.dismiss("kit-update-ready");
      window.clearTimeout(visibleTimer);
      window.clearTimeout(fillTimer);
      window.clearTimeout(resumeTimer);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("visibilitychange", onHidden);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onInteract, true);
      document.removeEventListener("keydown", onInteract, true);
      document.removeEventListener("wheel", onInteract, true);
      document.removeEventListener("touchstart", onInteract, true);
    };
  }, [locale, router, t]);

  return null;
}
