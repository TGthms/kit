"use client";

import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { ToolId } from "@/lib/tools/registry";
import { getTool, isFileTool } from "@/lib/tools/registry";
import { useToolBack } from "@/lib/navigation/address";
import { toolShareUrl } from "@/lib/seo/share";
import { useHydrated } from "@/lib/react/hydrated";
import { useFavoritesStore } from "@/stores/favorites-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/ui/share-button";

/**
 * The heading of a tool page: its name, what it does, and what a visitor can do
 * with it besides use it.
 *
 * This sits above the tool rather than inside it, so the name and description
 * are part of the document a crawler is served. Everything here works from
 * props and the address bar alone: a search-param hook would hold the heading
 * back to the client and leave the page with no heading in its HTML at all.
 *
 * `subtitle` is handed in by the route, which reads it from the catalog server
 * side: the card label the client catalog carries is a shorter string, and a
 * sentence is what this page wants. The label stays the fallback so a language
 * without a sentence of its own renders exactly as it did before.
 */
export function ToolIntro({ toolId, subtitle }: { toolId: ToolId; subtitle?: string }) {
  const t = useTranslations(`tools.${toolId}`);
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");
  const locale = useLocale();
  /* SSR renders ids:[]; gating the favorite state on hydration keeps the
     first client render identical to the server tree (no mismatch). */
  const hydrated = useHydrated();
  const { ids, toggle } = useFavoritesStore();
  const fav = hydrated && ids.includes(toolId);
  const tool = getTool(toolId);
  const back = useToolBack(toolId);
  const backLabel = back.fromElsewhere ? tc("back") : tool ? tCat(tool.category) : tc("back");
  const showClientSideNote = tool ? isFileTool(tool) : false;

  return (
    <PageHeader
      title={t("name")}
      subtitle={subtitle || t("description")}
      backHref={back.href}
      backLabel={backLabel}
      below={
        showClientSideNote ? (
          <Badge variant="secondary" className="mt-0.5 max-w-full whitespace-normal text-left font-normal">
            {tc("clientSideOnly")}
          </Badge>
        ) : undefined
      }
      trailing={
        <div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row">
          <ShareButton title={t("name")} text={t("description")} url={toolShareUrl(locale, toolId)} />
          <Button
            variant={fav ? "default" : "outline"}
            size="sm"
            className="h-10 w-full rounded-full sm:w-fit"
            onClick={() => toggle(toolId)}
          >
            <Star className={fav ? "fill-current" : ""} />
            {fav ? tc("unfavorite") : tc("favorite")}
          </Button>
        </div>
      }
    />
  );
}
