"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Home, History, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { withAsset } from "@/lib/base-path";
import { ThemeToggle } from "./theme-toggle";
import { SiteFooter } from "./footer";
import { LocaleSwitcher } from "./locale-switcher";

const nav = [
  { href: "/", key: "home", icon: Home },
  { href: "/favorites", key: "favorites", icon: Star },
  { href: "/history", key: "history", icon: History },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SCROLL_STORAGE_PREFIX = "kit-scroll:";

function ScrollRestoration({ pathname }: { pathname: string }) {
  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const key = `${SCROLL_STORAGE_PREFIX}${window.location.pathname}${window.location.search}`;
    const saved = sessionStorage.getItem(key);
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (saved !== null) window.scrollTo({ top: Number(saved), behavior: "auto" });
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      sessionStorage.setItem(key, String(window.scrollY));
      window.history.scrollRestoration = previousRestoration;
    };
  }, [pathname]);

  useEffect(() => {
    const rememberBeforeNavigation = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement) || target.target === "_blank" || target.hasAttribute("download")) return;
      if (target.origin !== window.location.origin) return;
      const key = `${SCROLL_STORAGE_PREFIX}${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem(key, String(window.scrollY));
    };
    document.addEventListener("click", rememberBeforeNavigation, true);
    return () => document.removeEventListener("click", rememberBeforeNavigation, true);
  }, []);

  return null;
}

/**
 * Desktop: side rail + top chrome.
 * Mobile: top chrome + bottom tab bar only (no redundant drawer/sidebar).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const pathname = usePathname();

  const SideNav = () => (
    <nav className="flex flex-col gap-1" aria-label={t("home")}>
      {nav.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            data-pressable
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

  const TabBar = () => (
    <nav
      className="glass chrome-edge fixed inset-x-0 bottom-0 z-40 md:hidden safe-pb"
      aria-label={tb("name")}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {nav.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              data-pressable
              className={cn(
                "pressable-soft flex min-h-[3.75rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5",
                "text-[11px] font-medium tracking-[-0.01em]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200",
                  active && "bg-primary/12"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
              </span>
              <span className="max-w-full truncate">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background">
      <ScrollRestoration pathname={pathname} />
      <header className="glass chrome-edge fixed inset-x-0 top-0 z-50 shrink-0 pt-[env(safe-area-inset-top)] md:sticky md:inset-auto">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-2 px-4 sm:h-14 sm:gap-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            data-pressable
            className="pressable-soft flex min-w-0 items-center gap-2 font-semibold tracking-[-0.02em]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withAsset("/icons/icon.svg")}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-[9px] shadow-sm"
              draggable={false}
            />
            <span className="truncate text-[17px] leading-none">{tb("name")}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            {/* Language lives in header + Settings — not a second mobile nav */}
            <div className="hidden sm:block">
              <LocaleSwitcher />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 pb-5 pt-[calc(3rem+env(safe-area-inset-top)+1.25rem)] sm:px-6 sm:py-8 lg:px-8">
        <aside className="hidden w-[13.5rem] shrink-0 md:block">
          <div className="glass-heavy sticky top-[4.5rem] rounded-2xl border border-border/35 p-2.5 surface-float">
            <SideNav />
          </div>
        </aside>

        <main className="anim-surface min-w-0 flex-1 pb-3 md:pb-8">{children}</main>
      </div>

      <div className="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <SiteFooter />
      </div>

      <TabBar />
    </div>
  );
}
