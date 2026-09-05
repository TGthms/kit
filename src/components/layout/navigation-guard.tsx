"use client";

import { useEffect } from "react";
import { htmlHref, isRscDocumentPath } from "@/lib/navigation/html-path";

const HANG_MS = 8000;

/**
 * After idle, Next's client router can push the static RSC file (`index.txt`)
 * as if it were a page. Recover that URL. Offline in-app clicks load cached
 * HTML. Do not turn a slow client navigation into a full document load — that
 * is the tab spinner after the tab has been sitting idle.
 */
export function NavigationGuard() {
  useEffect(() => {
    const recoverTxt = () => {
      if (!isRscDocumentPath(window.location.pathname)) return;
      window.location.replace(htmlHref(window.location.href, window.location.origin));
    };
    recoverTxt();

    let hangTimer = 0;
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      if (link.origin !== window.location.origin) return;
      const next = htmlHref(link.href, window.location.origin);
      const from = htmlHref(window.location.href, window.location.origin);
      if (next.split("#")[0] === from.split("#")[0]) return;
      if (!navigator.onLine) {
        event.preventDefault();
        window.location.assign(next);
        return;
      }
      window.clearTimeout(hangTimer);
      hangTimer = window.setTimeout(() => {
        if (isRscDocumentPath(window.location.pathname)) {
          window.location.replace(htmlHref(window.location.href, window.location.origin));
        }
      }, HANG_MS);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", recoverTxt);
    return () => {
      window.clearTimeout(hangTimer);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", recoverTxt);
    };
  }, []);

  return null;
}
