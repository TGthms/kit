"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Home, History, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingNav } from "@/components/ui/floating-nav";
import { GlidingPill, useGlidingPill } from "@/components/ui/gliding-pill";
import {
  keyboardCoverPx,
  scrollActiveTabToTop,
  shouldHideFloatingTabBar,
} from "@/lib/pwa/tab-bar";
import { useHydrated } from "@/lib/react/hydrated";

export const nav = [
  { href: "/", key: "home", icon: Home },
  { href: "/favorites", key: "favorites", icon: Star },
  { href: "/history", key: "history", icon: History },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

/**
 * Which destination a pathname belongs to. A tool page sits under the home
 * section, so a prefix match is what keeps Home highlighted while a tool is
 * open.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  return (
    <nav className="flex flex-col gap-1" aria-label={t("tools")}>
      {nav.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            data-pressable
            data-restore-scroll
            aria-current={active ? "page" : undefined}
            className={cn(
              "nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium pressable-soft",
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The floating tab bar is hidden while a software keyboard covers the lower
 * part of the viewport, so it never sits on top of what is being typed.
 */
function useKeyboardHidesTabBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const visual = window.visualViewport;
    if (!visual) return;
    const update = () => {
      const viewportHeight = window.innerHeight;
      setHidden(shouldHideFloatingTabBar(keyboardCoverPx(viewportHeight, visual), viewportHeight));
    };
    update();
    visual.addEventListener("resize", update);
    visual.addEventListener("scroll", update);
    return () => {
      visual.removeEventListener("resize", update);
      visual.removeEventListener("scroll", update);
    };
  }, []);

  return hidden;
}

export function TabBar({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const { rect, ready } = useGlidingPill(container, target);
  const keyboardHidden = useKeyboardHidesTabBar();
  const hydrated = useHydrated();
  const previousActive = useRef<string | null>(null);
  const pendingSpentAt = useRef(pathname);
  const [popHref, setPopHref] = useState<string | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const currentHref = nav.find((item) => isActive(pathname, item.href))?.href ?? "/";
  const selectedHref = pendingHref && !isActive(pathname, pendingHref) ? pendingHref : currentHref;
  const activeIndex = nav.findIndex((item) => item.href === selectedHref);

  useLayoutEffect(() => {
    const current = nav.find((item) => isActive(pathname, item.href))?.href ?? null;
    if (previousActive.current !== null && previousActive.current !== current && current) {
      setPopHref(current);
    }
    /* A tap moves the highlight straight away, before the route has changed, so
       the bar answers the tap immediately. That optimistic value is spent by the
       route change itself: keeping it would outlive the navigation, and going
       back afterwards could leave the highlight on the tab it came from rather
       than the one on screen. */
    if (pendingSpentAt.current !== pathname) {
      pendingSpentAt.current = pathname;
      setPendingHref(null);
    }
    previousActive.current = current;
  }, [pathname]);

  // Before hydration these links are plain anchors, so an early tap is a real
  // document navigation and the pill cannot glide across documents. The fallback
  // geometry in globals.css matches the measured box exactly, so the destination
  // paints the highlight on the correct tab.
  return (
    <FloatingNav
      aria-label={tb("name")}
      contentRef={setContainer}
      keyboardHidden={keyboardHidden}
    >
      <GlidingPill
        rect={rect}
        ready={ready}
        hydrated={hydrated}
        fallbackIndex={Math.max(0, activeIndex)}
        fallbackCount={nav.length}
        className="gliding-pill-fast rounded-full bg-primary/12"
      />
      {nav.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        const selected = href === selectedHref;
        const pending = pendingHref === href && !active;
        return (
          <Link
            key={href}
            href={href}
            data-pressable
            data-restore-scroll
            aria-current={active ? "page" : undefined}
            tabIndex={keyboardHidden ? -1 : undefined}
            className={cn(
              "pressable-soft relative z-10 flex min-h-[3.6rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1",
              "text-[11px] font-medium tracking-[-0.01em]",
              selected ? "text-primary" : "text-muted-foreground"
            )}
            onClick={(event) => {
              if (!active) {
                setPendingHref(href);
                return;
              }
              scrollActiveTabToTop(event, {
                reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                scrollTo: (opts) => window.scrollTo(opts),
              });
            }}
          >
            <span
              ref={(el) => {
                if (selected && el) setTarget(el);
              }}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
            />
            <span
              className="tab-icon relative"
              data-pop={selected && (pending || popHref === href) ? "" : undefined}
            >
              <Icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.25]")} />
            </span>
            <span className="relative max-w-full truncate">{t(key)}</span>
          </Link>
        );
      })}
    </FloatingNav>
  );
}
