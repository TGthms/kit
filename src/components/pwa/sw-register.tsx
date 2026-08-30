"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${base}/sw.js`;
    let registration: ServiceWorkerRegistration | null = null;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      window.location.reload();
    };
    if (hadController) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);

    navigator.serviceWorker
      .register(swUrl, { updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        return reg.update();
      })
      .catch(() => {
        /* ignore offline registration failures in dev */
      });

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
