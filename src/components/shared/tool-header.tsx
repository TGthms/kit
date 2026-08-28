"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import type { ToolId } from "@/lib/tools/registry";
import { getTool, isFileTool } from "@/lib/tools/registry";
import { Link } from "@/lib/i18n/navigation";
import { toolBackHref } from "@/lib/navigation/routes";
import { useFavoritesStore } from "@/stores/favorites-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function safeInternalHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : null;
  } catch {
    return null;
  }
}

export function ToolHeader({ toolId }: { toolId: ToolId }) {
  const t = useTranslations(`tools.${toolId}`);
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");
  const searchParams = useSearchParams();
  const { ids, toggle } = useFavoritesStore();
  const fav = ids.includes(toolId);
  const tool = getTool(toolId);
  const fromHref = safeInternalHref(searchParams.get("from"));
  const backHref = fromHref ?? toolBackHref(toolId);
  const backLabel = fromHref ? tc("back") : tool ? tCat(tool.category) : tc("back");
  const showClientSideNote = tool ? isFileTool(tool) : false;
  const floatingBackRef = useRef<HTMLAnchorElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const floatingBack = floatingBackRef.current;
    if (!floatingBack) return;

    const onScroll = () => {
      const scrolled = window.scrollY > 96;
      floatingBack.classList.toggle("translate-y-0", scrolled);
      floatingBack.classList.toggle("opacity-100", scrolled);
      floatingBack.classList.toggle("pointer-events-none", !scrolled);
      floatingBack.classList.toggle("-translate-y-1", !scrolled);
      floatingBack.classList.toggle("opacity-0", !scrolled);
      floatingBack.tabIndex = scrolled ? 0 : -1;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  return (
    <>
      <PageHeader
        sticky={false}
        title={t("name")}
        subtitle={t("description")}
        backHref={backHref}
        backLabel={backLabel}
        below={
          showClientSideNote ? (
            <Badge variant="secondary" className="mt-0.5 max-w-full whitespace-normal text-left font-normal">
              {tc("clientSideOnly")}
            </Badge>
          ) : undefined
        }
        trailing={
          <Button
            variant={fav ? "default" : "outline"}
            size="sm"
            className="h-10 w-full rounded-full sm:w-fit"
            onClick={() => toggle(toolId)}
          >
            <Star className={fav ? "fill-current" : ""} />
            {fav ? tc("unfavorite") : tc("favorite")}
          </Button>
        }
      />
      {mounted
        ? createPortal(
            <Link
              ref={floatingBackRef}
              href={backHref}
              aria-label={backLabel}
              data-pressable
              data-restore-scroll
              tabIndex={-1}
              data-floating-back
              className={[
                "fixed left-4 top-[calc(3rem+env(safe-area-inset-top)+0.75rem)] z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/95 text-primary shadow-lg backdrop-blur-xl",
                "transition-[opacity,transform,box-shadow] duration-200 hover:shadow-xl active:scale-95 sm:left-6 sm:top-[calc(3.5rem+env(safe-area-inset-top)+0.75rem)] sm:h-12 sm:w-12",
                "pointer-events-none -translate-y-1 opacity-0",
              ].join(" ")}
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5] sm:h-6 sm:w-6" aria-hidden />
            </Link>,
            document.body
          )
        : null}
    </>
  );
}
