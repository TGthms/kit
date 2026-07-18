"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { tools, resolveToolId } from "@/lib/tools/registry";
import { useFavoritesStore } from "@/stores/favorites-store";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const tt = useTranslations("tools");
  const ids = useFavoritesStore((s) => s.ids);

  const list = useMemo(() => {
    const resolved = new Set(
      ids.map((id) => resolveToolId(id as string)).filter(Boolean) as string[]
    );
    return tools.filter((x) => resolved.has(x.id));
  }, [ids]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-display text-[1.75rem] sm:text-[2rem]">{t("title")}</h1>
        <p className="mt-1.5 type-body text-muted-foreground">{t("subtitle")}</p>
      </div>
      {list.length === 0 ? (
        <p className="type-body text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.id} href={`/tools/${tool.id}`} data-pressable>
                <Card className="h-full border-border/40 pressable-soft transition-shadow hover:surface-float-lg">
                  <CardHeader className="space-y-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-base tracking-[-0.01em]">
                      {tt(`${tool.id}.name`)}
                    </CardTitle>
                    <CardDescription>{tt(`${tool.id}.description`)}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
