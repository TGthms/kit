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
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-background">
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
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-2 px-4 sm:h-14 sm:gap-3 sm:px-6 lg:px-8">
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
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <RouteProgress />
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 pb-5 pt-[calc(3rem+env(safe-area-inset-top)+1.25rem)] sm:px-6 sm:pt-[calc(3.5rem+env(safe-area-inset-top)+2rem)] lg:px-8">
        <aside className="hidden w-[13.5rem] shrink-0 md:block">
          <div className="glass-heavy sticky top-[4.5rem] rounded-2xl border border-border/35 p-2.5 surface-float">
            <SideNav pathname={pathname} />
          </div>
        </aside>

        <main id="kit-main" tabIndex={-1} className="anim-surface min-w-0 flex-1 pb-3 md:pb-8">{children}</main>
      </div>

      <div className="pb-[var(--floating-tabbar-clearance)] md:pb-0">
        <SiteFooter />
      </div>

      <TabBar pathname={pathname} />
    </div>
  );
}
