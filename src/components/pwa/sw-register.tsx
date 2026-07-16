"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
      /* ignore offline registration failures in dev */
    });
  }, []);
  return null;
}
