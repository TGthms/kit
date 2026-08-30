"use client";

import { useEffect } from "react";

const UPDATE_EVERY_MS = 5 * 60 * 1000;
const UPDATE_AFTER_VISIBLE_MS = 4000;

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${base}/sw.js`;
    let registration: ServiceWorkerRegistration | null = null;
    let lastUpdateAt = 0;
    let visibleTimer = 0;

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

    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("click", onClick, true);

    navigator.serviceWorker
      .register(swUrl, { updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        lastUpdateAt = Date.now();
        return reg.update();
      })
      .catch(() => {
        /* ignore offline registration failures in dev */
      });

    return () => {
      window.clearTimeout(visibleTimer);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
