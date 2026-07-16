"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { tools } from "@/lib/tools/registry";
import { useFavoritesStore } from "@/stores/favorites-store";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const tt = useTranslations("tools");
  const ids = useFavoritesStore((s) => s.ids);
  const list = tools.filter((x) => ids.includes(x.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.id} href={`/tools/${tool.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-base">{tt(`${tool.id}.name`)}</CardTitle>
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
