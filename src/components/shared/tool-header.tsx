"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import type { ToolId } from "@/lib/tools/registry";
import { getTool, isFileTool } from "@/lib/tools/registry";
import { toolBackHref } from "@/lib/navigation/routes";
import { toolShareUrl } from "@/lib/seo/share";
import { useFavoritesStore } from "@/stores/favorites-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/ui/share-button";

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
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { ids, toggle } = useFavoritesStore();
  const fav = ids.includes(toolId);
  const tool = getTool(toolId);
  const fromHref = safeInternalHref(searchParams.get("from"));
  const backHref = fromHref ?? toolBackHref(toolId);
  const backLabel = fromHref ? tc("back") : tool ? tCat(tool.category) : tc("back");
  const showClientSideNote = tool ? isFileTool(tool) : false;

  return (
    <PageHeader
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
