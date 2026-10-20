"use client";

import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Home, History, Star, Settings, Search, FileText, ImageIcon, AudioLines, Clapperboard, Database, Type, Code2, Calculator, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingNav } from "@/components/ui/floating-nav";
import { GlidingPill, useGlidingPill } from "@/components/ui/gliding-pill";
import {
  keyboardCoverPx,
  scrollActiveTabToTop,
  shouldHideFloatingTabBar,
} from "@/lib/pwa/tab-bar";
import { useHydrated } from "@/lib/react/hydrated";
import { categories, getTool, type ToolCategory } from "@/lib/tools/registry";
import { homeHref, parseCategoryPath } from "@/lib/navigation/routes";
import { isPlainNavigationClick } from "@/lib/navigation/intent";
import { openToolSearch } from "@/lib/navigation/search";
import { useLiquidGlassEnabled } from "@/lib/theme/liquid-glass";
import { GlassBoundary } from "@/components/ui/glass-boundary";

const LiquidTabBar = lazy(() => import("./liquid-glass-tab").then((module) => ({ default: module.LiquidTabBar })));

function subscribeMobile(listener: () => void) {
  const query = window.matchMedia("(max-width: 767px)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

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
  if (href === "/") return pathname === "/" || pathname === "" || pathname.startsWith("/tools/") || pathname.startsWith("/c/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

const categoryIcons = { pdf: FileText, image: ImageIcon, audio: AudioLines, video: Clapperboard, data: Database, text: Type, developer: Code2, everyday: Calculator, converter: ArrowLeftRight };

export function activeCategory(pathname: string): ToolCategory | null {
  const category = parseCategoryPath(pathname);
  if (category) return category;
  const id = pathname.match(/^\/tools\/([^/]+)\/?$/)?.[1];
  return id ? getTool(id === "world-clock" ? "timezone-converter" : id)?.category ?? null : null;
}

export function SideNav({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("categories");
  const th = useTranslations("home");
  const category = activeCategory(pathname);
  return (
    <nav className="flex flex-col gap-1" aria-label={t("tools")}>
      <button type="button" onClick={openToolSearch} aria-haspopup="dialog" className="mb-2 flex min-h-11 items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 text-sm text-muted-foreground hover:bg-secondary/70 hover:text-foreground">
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-start">{t("searchPlaceholder")}</span>
        <kbd aria-hidden className="rounded border border-border px-1.5 text-xs">/</kbd>
      </button>
      {nav.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            data-pressable
            data-restore-scroll
            aria-current={active ? (pathname.replace(/\/$/, "") === href.replace(/\/$/, "") ? "page" : "location") : undefined}
            className={cn(
              "nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium pressable-soft",
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {t(key)}
          </Link>
        );
      })}
      <div className="mt-3 border-t border-border/60 pt-3">
        <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{th("categories")}</p>
        <ul className="space-y-0.5">
          {categories.map((id) => {
            const Icon = categoryIcons[id];
            const active = category === id;
            return <li key={id}><Link href={homeHref(id)} data-pressable data-restore-scroll aria-current={active ? (parseCategoryPath(pathname) === id ? "page" : "location") : undefined} className={cn("nav-item pressable-soft flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm", active ? "bg-primary/12 font-medium text-primary" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground")}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden /><span className="min-w-0">{tc(id)}</span>
            </Link></li>;
          })}
        </ul>
      </div>
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

function StandardTabBar({ pathname, keyboardHidden }: { pathname: string; keyboardHidden: boolean }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const { rect, ready } = useGlidingPill(container, target);
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
            aria-current={active ? (pathname.replace(/\/$/, "") === href.replace(/\/$/, "") ? "page" : "location") : undefined}
            tabIndex={keyboardHidden ? -1 : undefined}
            className={cn(
              "pressable-soft relative z-10 flex min-h-[3.6rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1",
              "text-[11px] font-medium tracking-[-0.01em]",
              selected ? "text-primary" : "text-muted-foreground"
            )}
            onClick={(event) => {
              if (!isPlainNavigationClick(event)) return;
              // Home owns tools/categories, but tapping it there must still
              // navigate home. Only re-tapping the destination scrolls up.
              const atDestination = pathname.replace(/\/$/, "") === href.replace(/\/$/, "");
              if (!atDestination) {
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
              <Icon aria-hidden className={cn("h-[22px] w-[22px]", active && "stroke-[2.25]")} />
            </span>
            <span className="relative max-w-full truncate">{t(key)}</span>
          </Link>
        );
      })}
    </FloatingNav>
  );
}

export function TabBar({ pathname }: { pathname: string }) {
  const enabled = useLiquidGlassEnabled();
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, () => false);
  const keyboardHidden = useKeyboardHidesTabBar();
  const fallback = <StandardTabBar pathname={pathname} keyboardHidden={keyboardHidden} />;
  if (!enabled || !mobile || keyboardHidden) return fallback;
  return <GlassBoundary fallback={fallback}><Suspense fallback={fallback}>
    <LiquidTabBar pathname={pathname} fallback={fallback} />
  </Suspense></GlassBoundary>;
}
