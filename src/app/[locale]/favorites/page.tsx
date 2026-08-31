"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { tools, resolveToolId } from "@/lib/tools/registry";
import { toolHref } from "@/lib/navigation/routes";
import { useFavoritesStore } from "@/stores/favorites-store";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/page-loader";
import { useHydrated } from "@/lib/react/hydrated";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const tt = useTranslations("tools");
  const tn = useTranslations("nav");
  const ids = useFavoritesStore((s) => s.ids);
  const hydrated = useHydrated();

  const list = useMemo(() => {
    const resolved = new Set(
      ids.map((id) => resolveToolId(String(id))).filter(Boolean) as string[]
    );
    return tools.filter((x) => resolved.has(x.id));
  }, [ids]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} backHref="/" backLabel={tn("home")} />

      {!hydrated ? (
        <PageLoader />
      ) : list.length === 0 ? (
        <p className="type-body text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.id} href={toolHref(tool.id, "/favorites")} data-pressable>
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
