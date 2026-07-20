"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { ToolId } from "@/lib/tools/registry";
import { getTool } from "@/lib/tools/registry";
import { toolBackHref } from "@/lib/navigation/routes";
import { useFavoritesStore } from "@/stores/favorites-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ToolHeader({ toolId }: { toolId: ToolId }) {
  const t = useTranslations(`tools.${toolId}`);
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");
  const { ids, toggle } = useFavoritesStore();
  const fav = ids.includes(toolId);
  const tool = getTool(toolId);
  const backHref = toolBackHref(toolId);
  const backLabel = tool ? tCat(tool.category) : tc("back");

  return (
    <PageHeader
      title={t("name")}
      subtitle={t("description")}
      backHref={backHref}
      backLabel={backLabel}
      below={
        <Badge variant="secondary" className="mt-0.5 max-w-full whitespace-normal text-left font-normal">
          {tc("clientSideOnly")}
        </Badge>
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
  );
}
