"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  GlassContent, GlassScene, GlassTabsRoot, GlassTabsList,
  GlassTabsIndicator, GlassTabsTrigger,
} from "@glass-sdk/liquid-glass";
import "@glass-sdk/liquid-glass/styles.css";
import { Link } from "@/lib/i18n/navigation";
import { isPlainNavigationClick } from "@/lib/navigation/intent";
import { scrollActiveTabToTop } from "@/lib/pwa/tab-bar";
import { cn } from "@/lib/utils";
import { useGlassHealth } from "@/lib/theme/glass-health";
import { isActive, nav } from "./tab-bar";

/** Real SDK tabs: drag the selection, release to navigate, arrows to focus. */
export function LiquidTabBar({ pathname, fallback }: { pathname: string; fallback: ReactNode }) {
  const t = useTranslations("nav");
  const brand = useTranslations("brand");
  const { resolvedTheme } = useTheme();
  const { failed, onDiagnostic } = useGlassHealth(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const previousPath = useRef(pathname);
  const drag = useRef<{ id: number; startX: number; startY: number; moved: boolean } | null>(null);
  const releaseTarget = useRef<string | null>(null);
  const currentHref = nav.find((item) => isActive(pathname, item.href))?.href ?? "/";
  const selected = pendingHref ?? currentHref;

  useLayoutEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      setPendingHref(null);
    }
  }, [pathname]);

  if (failed) return fallback;
  return (
    <nav aria-label={brand("name")} className="floating-nav pointer-events-none fixed inset-x-0 bottom-[var(--floating-tabbar-offset)] z-40 md:hidden">
      <div className="pointer-events-none mx-auto w-full max-w-lg px-3">
        <GlassScene
          className="kit-sdk-tab-scene pointer-events-auto"
          appearance={resolvedTheme === "dark" ? "dark" : "light"}
          material="clear"
          maxSurfaces={2}
          onDiagnostic={onDiagnostic}
        >
          {/* This small neutral layer is the only backdrop. Page content stays
              outside the scene and never goes through an SVG/GPU filter. */}
          <GlassContent aria-hidden className="kit-sdk-tab-backdrop" />
          <GlassTabsRoot value={selected} className="kit-sdk-tabs">
            <GlassTabsList
              aria-label={brand("name")}
              className="kit-sdk-tab-list chrome-touch"
              radius="capsule"
              refraction={0}
              interactive
              activateOnFocus={false}
              onPointerDownCapture={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
                releaseTarget.current = null;
              }}
              onPointerMoveCapture={(event) => {
                const gesture = drag.current;
                if (gesture?.id === event.pointerId && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 8) {
                  gesture.moved = true;
                  // Capture only after a drag starts. Capturing on pointer-down
                  // would retarget ordinary link taps to the list itself.
                  if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
                }
              }}
              onPointerCancel={() => { drag.current = null; releaseTarget.current = null; }}
              onPointerUpCapture={(event) => {
                const gesture = drag.current;
                drag.current = null;
                if (!gesture?.moved || gesture.id !== event.pointerId) return;
                const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>("a[data-kit-tab-href]"));
                const destination = tabs.reduce<HTMLAnchorElement | null>((nearest, tab) => {
                  const center = (item: HTMLAnchorElement) => { const box = item.getBoundingClientRect(); return box.left + box.width / 2; };
                  return !nearest || Math.abs(center(tab) - event.clientX) < Math.abs(center(nearest) - event.clientX) ? tab : nearest;
                }, null);
                if (!destination) return;
                // The SDK picks from its animated indicator position. A fast
                // swipe can leave that spring a tab behind the release point.
                // Keep its motion, but commit the actual release destination.
                releaseTarget.current = destination.dataset.kitTabHref ?? null;
                queueMicrotask(() => {
                  if (destination.isConnected && destination.dataset.kitTabHref !== selected) {
                    destination.focus({ preventScroll: true });
                    destination.click();
                  }
                  window.setTimeout(() => { releaseTarget.current = null; }, 0);
                });
              }}
            >
              <GlassTabsIndicator radius="capsule" refraction={3} className="kit-sdk-tab-indicator" />
              {nav.map(({ href, key, icon: Icon }) => {
                const active = isActive(pathname, href);
                const atDestination = pathname.replace(/\/$/, "") === href.replace(/\/$/, "");
                return (
                  <GlassTabsTrigger
                    key={href}
                    value={href}
                    nativeButton={false}
                    className={cn("kit-sdk-tab", selected === href && "kit-sdk-tab-selected")}
                    render={<Link
                      href={href}
                      draggable={false}
                      data-kit-tab-href={href}
                      data-restore-scroll
                      aria-current={active ? (atDestination ? "page" : "location") : undefined}
                      onClick={(event) => {
                        if (releaseTarget.current && releaseTarget.current !== href) { event.preventDefault(); return; }
                        if (!isPlainNavigationClick(event)) return;
                        if (!atDestination) { setPendingHref(href); return; }
                        scrollActiveTabToTop(event, {
                          reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                          scrollTo: (options) => window.scrollTo(options),
                        });
                      }}
                    />}
                  >
                    <Icon aria-hidden className={cn("h-[22px] w-[22px]", active && "stroke-[2.25]")} />
                    <span className="max-w-full truncate">{t(key)}</span>
                  </GlassTabsTrigger>
                );
              })}
            </GlassTabsList>
          </GlassTabsRoot>
        </GlassScene>
      </div>
    </nav>
  );
}
