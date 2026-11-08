"use client";

import { createContext, useContext, useEffect, useRef, useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { TabBar as GlassTabBar } from "@onlymoein/liquidglass";
import { Link } from "@/lib/i18n/navigation";
import { isPlainNavigationClick } from "@/lib/navigation/intent";
import { scrollActiveTabToTop } from "@/lib/pwa/tab-bar";
import { useGlassMaterial } from "@/lib/theme/liquid-glass";
import { useAppearanceStore } from "@/stores/appearance-store";
import { isActive, nav } from "./tab-bar";

const Pathname = createContext("/");
const trimSlash = (path: string) => path.replace(/\/$/, "");

function TabLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = useContext(Pathname);
  const atDestination = trimSlash(pathname) === trimSlash(href);
  return <Link
    {...props}
    href={href}
    data-restore-scroll
    aria-current={atDestination ? "page" : isActive(pathname, href) ? "location" : undefined}
    onClick={(event) => {
      if (!atDestination || !isPlainNavigationClick(event)) return;
      scrollActiveTabToTop(event, {
        reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        scrollTo: (options) => window.scrollTo(options),
      });
    }}
  />;
}

export function LiquidTabBar({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  const brand = useTranslations("brand");
  const material = useGlassMaterial();
  const transparency = useAppearanceStore((state) => state.glassTransparency);
  const [fittedTransparency, setFittedTransparency] = useState(transparency);
  const container = useRef<HTMLDivElement>(null);
  const current = nav.find((item) => isActive(pathname, item.href))?.href ?? "/";

  useEffect(() => {
    // Chromium's SVG backdrop bakes in the blur when the library measures the
    // bar. Refit after scrubbing settles, while the CSS tint responds live.
    if (fittedTransparency === transparency || !/Chrom(?:e|ium)\//.test(navigator.userAgent)) return;
    const root = container.current;
    let timer = 0;
    const scheduleRefit = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Replacing the SDK surface would cancel its pointer capture or drop
        // a keyboard user's focus. Wait for the gesture or focus to leave.
        if (root?.querySelector(".lg-tab-bar[data-lifted]")) scheduleRefit();
        else if (!root?.querySelector("a.lg-tab:focus-visible")) setFittedTransparency(transparency);
      }, 200);
    };
    scheduleRefit();
    root?.addEventListener("focusout", scheduleRefit);
    return () => {
      window.clearTimeout(timer);
      root?.removeEventListener("focusout", scheduleRefit);
    };
  }, [fittedTransparency, transparency]);

  useEffect(() => {
    let sdkActivated = false;
    const reset = () => { sdkActivated = false; };
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !container.current?.contains(event.target)) return;
      if (!event.isTrusted && event.target.closest("a.lg-tab")) {
        sdkActivated = true;
      } else if (event.isTrusted && event.detail > 0 && sdkActivated) {
        // The SDK clicks the released link on pointerup. Its own suppression
        // happens at the bar, after Kit's document-level offline route guard.
        sdkActivated = false;
        event.preventDefault();
      }
    };
    window.addEventListener("pointerdown", reset, true);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("pointerdown", reset, true);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  // Let the library own pointer capture, drag animation and click suppression.
  // Its release clicks the actual link, so routing, Back and modified clicks
  // all use the same localized Next navigation as the stable bar.
  return (
    <div className="floating-nav pointer-events-none fixed inset-x-0 bottom-[var(--floating-tabbar-offset)] z-40 md:hidden">
      <div ref={container} className="mx-auto w-full max-w-lg px-3 [container-type:inline-size]">
        <Pathname.Provider value={pathname}>
          <GlassTabBar
            key={fittedTransparency}
            {...material}
            aria-label={brand("name")}
            className="kit-liquid-tab-bar chrome-touch pointer-events-auto"
            link={TabLink}
            value={current}
            items={nav.map(({ href, key, icon: Icon }) => ({
              href,
              value: href,
              label: <span className="max-w-full truncate px-1">{t(key)}</span>,
              icon: <Icon aria-hidden strokeWidth={href === current ? 2.25 : 2} />,
            }))}
          />
        </Pathname.Provider>
      </div>
    </div>
  );
}
