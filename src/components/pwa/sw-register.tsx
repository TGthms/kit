"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${base}/sw.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        // Pick up kit-shell-v3 (and future) immediately when available
        reg.update().catch(() => undefined);
      })
      .catch(() => {
        /* ignore offline registration failures in dev */
      });
  }, []);

  return null;
}
