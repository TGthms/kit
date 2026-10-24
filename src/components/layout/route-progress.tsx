"use client";

import { useEffect, useState } from "react";
import { isPlainNavigationClick } from "@/lib/navigation/intent";

const SHOW_AFTER_MS = 140;
const STOP_AFTER_MS = 12_000;

function hrefKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function isInAppNavigation(link: HTMLAnchorElement) {
  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return false;
  if (link.origin !== window.location.origin) return false;
  return `${link.pathname}${link.search}` !== hrefKey();
}

/** Indeterminate bar under the top chrome while an in-app route is resolving. */
export function RouteProgress() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let armedFrom: string | null = null;
    let showTimer = 0;
    let pollTimer = 0;
    let stopTimer = 0;

    const clear = (update = true) => {
      armedFrom = null;
      window.clearTimeout(showTimer);
      window.clearTimeout(pollTimer);
      window.clearTimeout(stopTimer);
      if (update) setActive(false);
    };

    const watch = () => {
      if (!armedFrom) return;
      if (hrefKey() !== armedFrom) {
        clear();
        return;
      }
      pollTimer = window.setTimeout(watch, 100);
    };

    const arm = () => {
      clear();
      armedFrom = hrefKey();
      showTimer = window.setTimeout(() => {
        if (armedFrom) setActive(true);
      }, SHOW_AFTER_MS);
      pollTimer = window.setTimeout(watch, 100);
      // Cancelled/failed routes must not leave a permanent spinner or an
      // animation-frame loop running for the rest of this app session.
      stopTimer = window.setTimeout(clear, STOP_AFTER_MS);
    };

    const onClick = (event: MouseEvent) => {
      if (!isPlainNavigationClick(event)) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || !isInAppNavigation(link)) return;
      arm();
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") clear();
    };
    const reset = () => clear();

    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", reset);
    window.addEventListener("pageshow", reset);
    window.addEventListener("popstate", reset);
    return () => {
      clear(false);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", reset);
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("popstate", reset);
    };
  }, []);

  return (
    <div
      className="kit-route-progress"
      data-active={active ? "true" : "false"}
      dir="ltr"
      aria-hidden={!active}
    />
  );
}
