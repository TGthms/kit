"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

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
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        className={cn(
          "sticky z-40 -mx-4 mb-3 flex h-12 items-center gap-1 border-b border-border/40 bg-background px-3",
          "top-[calc(3rem+env(safe-area-inset-top))] sm:hidden",
          compact ? "flex" : "hidden"
        )}
      >
        <Link
          href={backHref}
          data-pressable
          data-restore-scroll
          aria-label={backLabel}
          className="pressable-soft inline-flex h-11 w-11 items-center justify-center rounded-full text-primary"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" aria-hidden />
        </Link>
        <p className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.015em]">{t("name")}</p>
      </div>
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
    </>
  );
}
