"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { ToolId } from "@/lib/tools/registry";
import { useFavoritesStore } from "@/stores/favorites-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ToolHeader({ toolId }: { toolId: ToolId }) {
  const t = useTranslations(`tools.${toolId}`);
  const tc = useTranslations("common");
  const { ids, toggle } = useFavoritesStore();
  const fav = ids.includes(toolId);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("name")}</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{t("description")}</p>
        <Badge variant="secondary" className="mt-2 font-normal">
          {tc("clientSideOnly")}
        </Badge>
      </div>
      <Button
        variant={fav ? "default" : "outline"}
        size="sm"
        className="w-fit shrink-0 rounded-full"
        onClick={() => toggle(toolId)}
      >
        <Star className={fav ? "fill-current" : ""} />
        {fav ? tc("unfavorite") : tc("favorite")}
      </Button>
    </div>
  );
}
