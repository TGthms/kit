"use client";

import { Suspense, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { withAsset } from "@/lib/base-path";
import { startRecentSession } from "@/lib/navigation/recent";
import { SideNav, TabBar } from "./tab-bar";
import { ThemeToggle } from "./theme-toggle";
import { SiteFooter } from "./footer";
import { LocaleSwitcher } from "./locale-switcher";
import { RouteProgress } from "./route-progress";
import { ScrollRestoration } from "./scroll-restoration";
import { OfflineIndicator } from "./offline-indicator";
import { ToolSearch } from "./tool-search";

function ScrollRestorationBound({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  return <ScrollRestoration locationKey={`${pathname}?${searchParams.toString()}`} />;
}

/**
 * Desktop: side rail + top chrome.
 * Mobile: top chrome + floating bottom tab bar (no redundant drawer/sidebar).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const tb = useTranslations("brand");
  const tc = useTranslations("common");
  const pathname = usePathname();

  useEffect(() => {
    startRecentSession(pathname);
  }, [pathname]);

  return (
    <div className="kit-app-shell flex min-h-dvh flex-col overflow-x-clip bg-background">
      <a
        href="#kit-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[80] focus:m-3 focus:rounded-xl focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        {tc("skipToContent")}
      </a>
      <Suspense fallback={null}>
        <ScrollRestorationBound pathname={pathname} />
      </Suspense>
      <header className="glass chrome-edge chrome-touch fixed inset-x-0 top-0 z-50 shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="kit-chrome-gutters flex h-12 w-full items-center justify-between gap-2 px-4 sm:h-14 sm:gap-3 sm:px-6">
          {/* The offline indicator sits outside the home link so it does not join
              that link's accessible name. */}
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              data-pressable
              data-restore-scroll
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
            <OfflineIndicator />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {/* Language lives in header + Settings — not a second mobile nav */}
            <ToolSearch mobile />
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <RouteProgress />
      </header>

      <aside className="kit-sidebar fixed bottom-0 start-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-30 hidden w-60 flex-col border-e border-border/60 px-3 py-5 md:flex">
        <ToolSearch />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><SideNav pathname={pathname} /></div>
      </aside>

      <div className="min-w-0 flex-1 px-4 pb-5 pt-[calc(3rem+env(safe-area-inset-top)+1.25rem)] sm:px-6 sm:pt-[calc(3.5rem+env(safe-area-inset-top)+2rem)] md:ms-60 md:px-8 lg:px-10 xl:px-12">
        <main id="kit-main" tabIndex={-1} className="anim-surface min-w-0 w-full max-w-[100rem] pb-3 md:pb-8">{children}</main>
      </div>

      <div className="pb-[var(--floating-tabbar-clearance)] md:ms-60 md:pb-0">
        <SiteFooter />
      </div>

      <TabBar pathname={pathname} />
    </div>
  );
}
