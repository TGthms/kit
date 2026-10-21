"use client";

import { useEffect, useState } from "react";

/** A field covered by the fixed header cannot replace the global search. */
export function visiblePrimarySearch(): HTMLInputElement | null {
  const field = document.getElementById("kit-search");
  if (!(field instanceof HTMLInputElement)) return null;
  const box = field.getBoundingClientRect();
  const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
  return box.width > 0 && box.height > 0 && box.bottom > headerBottom && box.top < window.innerHeight ? field : null;
}

export function usePrimarySearchVisible(pathname: string): boolean {
  const expected = pathname === "/" || /^\/c\/[^/]+\/?$/u.test(pathname);
  const [snapshot, setSnapshot] = useState<{ path: string; visible: boolean } | null>(null);

  useEffect(() => {
    let intersection: IntersectionObserver | null = null;
    let headerSize: ResizeObserver | null = null;
    let frame = 0;
    let field: HTMLInputElement | null = null;
    const update = () => {
      frame = 0;
      const visible = Boolean(visiblePrimarySearch());
      setSnapshot((current) => current?.path === pathname && current.visible === visible ? current : { path: pathname, visible });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observe = () => {
      intersection?.disconnect();
      const candidate = document.getElementById("kit-search");
      field = candidate instanceof HTMLInputElement ? candidate : null;
      if (field && typeof IntersectionObserver !== "undefined") {
        const top = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
        intersection = new IntersectionObserver(schedule, { rootMargin: `-${top}px 0px 0px 0px` });
        intersection.observe(field);
      }
      schedule();
    };
    // The route can briefly contain a loading skeleton before its search mounts.
    const mutations = new MutationObserver(() => {
      if (document.getElementById("kit-search") !== field) observe();
    });
    mutations.observe(document.getElementById("kit-main") ?? document.body, { childList: true, subtree: true });
    if (typeof ResizeObserver !== "undefined") {
      headerSize = new ResizeObserver(observe);
      const header = document.querySelector("header");
      if (header) headerSize.observe(header);
    }
    observe();
    window.addEventListener("resize", schedule, { passive: true });
    // A fallback for environments without IntersectionObserver.
    if (typeof IntersectionObserver === "undefined") window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      intersection?.disconnect();
      headerSize?.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [pathname]);

  return snapshot?.path === pathname ? snapshot.visible : expected;
}
