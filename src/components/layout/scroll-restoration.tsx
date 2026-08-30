"use client";

import { useLayoutEffect } from "react";
import { scrollKeyFromLocation, scrollKeyFromUrl } from "@/lib/navigation/scroll";

const SCROLL_PREFIX = "kit-scroll:";
const RESTORE_NEXT = "kit-scroll-restore";

function readY(key: string): number {
  try {
    const value = Number(sessionStorage.getItem(`${SCROLL_PREFIX}${key}`));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeY(key: string, value: number) {
  try {
    sessionStorage.setItem(`${SCROLL_PREFIX}${key}`, String(Math.max(0, Math.round(value))));
  } catch {
    /* private mode */
  }
}

function takeRestoreFlag(): string | null {
  try {
    const value = sessionStorage.getItem(RESTORE_NEXT);
    if (value) sessionStorage.removeItem(RESTORE_NEXT);
    return value;
  } catch {
    return null;
  }
}

function markRestore(key: string) {
  try {
    sessionStorage.setItem(RESTORE_NEXT, key);
  } catch {
    /* private mode */
  }
}

function currentKey() {
  return scrollKeyFromLocation(window.location);
}

function scrollToY(top: number) {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo(0, top);
  html.style.scrollBehavior = previous;
}

/**
 * Persist window scroll per URL and restore it on back (in-app chevron, tabs,
 * popstate, PWA bfcache). New pushes start at the top.
 */
export function ScrollRestoration({ locationKey }: { locationKey: string }) {
  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const key = currentKey();
    let lastY = window.scrollY;
    const restoreFlag = takeRestoreFlag();
    const shouldRestore = restoreFlag === "*" || restoreFlag === key;
    const saved = shouldRestore ? readY(key) : 0;

    let frame = 0;
    let attempts = 0;
    const restore = () => {
      attempts += 1;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (saved <= 0) {
        scrollToY(0);
        return;
      }
      if (maxScroll >= saved || attempts >= 90) {
        scrollToY(Math.min(saved, maxScroll));
        return;
      }
      frame = window.requestAnimationFrame(restore);
    };

    if (shouldRestore && saved > 0) {
      frame = window.requestAnimationFrame(restore);
    } else {
      scrollToY(0);
    }

    const rememberScroll = () => {
      lastY = window.scrollY;
    };
    const save = () => writeY(key, lastY);

    window.addEventListener("scroll", rememberScroll, { passive: true });
    window.addEventListener("pagehide", save);
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const y = readY(currentKey());
      if (y > 0) scrollToY(y);
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.cancelAnimationFrame(frame);
      save();
      window.removeEventListener("scroll", rememberScroll);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("pageshow", onPageShow);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [locationKey]);

  useLayoutEffect(() => {
    const rememberBeforeNavigation = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a,button") : null;
      if (!target) return;
      if (target instanceof HTMLAnchorElement) {
        if (target.target === "_blank" || target.hasAttribute("download")) return;
        if (target.origin !== window.location.origin) return;
      } else if (!(target instanceof HTMLButtonElement) || !target.hasAttribute("data-navigation-intent")) {
        return;
      }
      writeY(currentKey(), window.scrollY);
      if (target.hasAttribute("data-restore-scroll")) {
        if (target instanceof HTMLAnchorElement) {
          markRestore(scrollKeyFromUrl(target.href));
        } else {
          markRestore("*");
        }
      }
    };
    const rememberPopstate = () => {
      markRestore("*");
    };
    document.addEventListener("click", rememberBeforeNavigation, true);
    window.addEventListener("popstate", rememberPopstate);
    return () => {
      document.removeEventListener("click", rememberBeforeNavigation, true);
      window.removeEventListener("popstate", rememberPopstate);
    };
  }, []);

  return null;
}
