"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { withBasePath } from "@/lib/base-path";

const UPDATE_EVERY_MS = 5 * 60 * 1000;
const UPDATE_AFTER_VISIBLE_MS = 4000;
const FILL_AFTER_IDLE_MS = 2500;
const FILL_RESUME_MS = 2000;

export function ServiceWorkerRegister() {
  const locale = useLocale();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${base}/sw.js`;
    const homeUrl = `${window.location.origin}${withBasePath(`/${locale}/`)}`;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const skipHeavy = Boolean(connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g");
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
    let lastUpdateAt = 0;
    let visibleTimer = 0;
    let fillTimer = 0;
    let resumeTimer = 0;

    const update = () => {
      visibleTimer = 0;
      if (!registration) return;
      const now = Date.now();
      if (now - lastUpdateAt < UPDATE_EVERY_MS) return;
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
        registration = reg;
        lastUpdateAt = Date.now();
        precacheHome(reg.active);
        navigator.serviceWorker.ready.then((ready) => {
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
  }, [locale]);

  return null;
}
