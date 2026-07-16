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
    <div className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight sm:text-3xl">
          {t("name")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {t("description")}
        </p>
        <Badge variant="secondary" className="mt-1 max-w-full whitespace-normal text-left font-normal">
          {tc("clientSideOnly")}
        </Badge>
      </div>
      <Button
        variant={fav ? "default" : "outline"}
        size="sm"
        className="h-10 w-full shrink-0 rounded-full sm:w-fit"
        onClick={() => toggle(toolId)}
      >
        <Star className={fav ? "fill-current" : ""} />
        {fav ? tc("unfavorite") : tc("favorite")}
      </Button>
    </div>
  );
}
