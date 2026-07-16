"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Star } from "lucide-react";
import { tools, categories, type ToolCategory } from "@/lib/tools/registry";
import { Link } from "@/lib/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavoritesStore } from "@/stores/favorites-store";
import { cn } from "@/lib/utils";

export function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("categories");
  const tcommon = useTranslations("common");
  const tt = useTranslations("tools");
  const tn = useTranslations("nav");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ToolCategory | "all">("all");
  const favIds = useFavoritesStore((s) => s.ids);
  const toggle = useFavoritesStore((s) => s.toggle);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tools.filter((tool) => {
      if (cat !== "all" && tool.category !== cat) return false;
      if (!query) return true;
      const name = tt(`${tool.id}.name`).toLowerCase();
      const desc = tt(`${tool.id}.description`).toLowerCase();
      const kw = tt(`${tool.id}.keywords`).toLowerCase();
      return name.includes(query) || desc.includes(query) || kw.includes(query) || tool.id.includes(query);
    });
  }, [q, cat, tt]);

  const pinned = tools.filter((t) => favIds.includes(t.id));

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="kit-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tn("searchPlaceholder")}
            className="h-11 rounded-2xl pl-10"
          />
        </div>
      </section>

      {pinned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("pinned")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={`/tools/${tool.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <CardTitle className="text-sm">{tt(`${tool.id}.name`)}</CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("categories")}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={cat === "all" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setCat("all")}
          >
            {tcommon("allCategories")}
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setCat(c)}
            >
              {tc(c)}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("popular")}
        </h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noResults")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => {
              const Icon = tool.icon;
              const fav = favIds.includes(tool.id);
              return (
                <Card key={tool.id} className="group relative h-full transition-shadow hover:shadow-md">
                  <button
                    type="button"
                    className={cn(
                      "absolute right-3 top-3 z-10 rounded-full p-1.5 transition-colors",
                      fav ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(tool.id);
                    }}
                    aria-label="favorite"
                  >
                    <Star className={cn("h-4 w-4", fav && "fill-current")} />
                  </button>
                  <Link href={`/tools/${tool.id}`} className="block h-full">
                    <CardHeader className="space-y-3 p-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="pr-6 text-[15px]">{tt(`${tool.id}.name`)}</CardTitle>
                        <CardDescription className="mt-1.5 line-clamp-2">
                          {tt(`${tool.id}.description`)}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                      <span className="text-xs font-medium text-muted-foreground">{tc(tool.category)}</span>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
