"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_MS = 140;

function hrefKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function isInAppNavigation(link: HTMLAnchorElement) {
  if (link.target === "_blank" || link.hasAttribute("download")) return false;
  if (link.origin !== window.location.origin) return false;
  return `${link.pathname}${link.search}` !== hrefKey();
}

/** Indeterminate bar under the top chrome while an in-app route is resolving. */
export function RouteProgress() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let armedFrom: string | null = null;
    let showTimer = 0;
    let raf = 0;

    const clear = (update = true) => {
      armedFrom = null;
      window.clearTimeout(showTimer);
      window.cancelAnimationFrame(raf);
      if (update) setActive(false);
    };

    const watch = () => {
      if (!armedFrom) return;
      if (hrefKey() !== armedFrom) {
        clear();
        return;
      }
      raf = window.requestAnimationFrame(watch);
    };

    const arm = () => {
      armedFrom = hrefKey();
      window.clearTimeout(showTimer);
      showTimer = window.setTimeout(() => {
        if (armedFrom) setActive(true);
      }, SHOW_AFTER_MS);
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(watch);
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || !isInAppNavigation(link)) return;
      arm();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      clear(false);
      document.removeEventListener("click", onClick, true);
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
