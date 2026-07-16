"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Star,
  ChevronLeft,
  FileText,
  ImageIcon,
  Clapperboard,
  ArrowLeftRight,
  Type,
} from "lucide-react";
import { tools, categories, type ToolCategory } from "@/lib/tools/registry";
import { Link } from "@/lib/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavoritesStore } from "@/stores/favorites-store";
import { cn } from "@/lib/utils";

const categoryMeta: Record<
  ToolCategory,
  { icon: typeof FileText; tint: string; ring: string }
> = {
  pdf: {
    icon: FileText,
    tint: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    ring: "hover:ring-sky-500/25",
  },
  image: {
    icon: ImageIcon,
    tint: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    ring: "hover:ring-violet-500/25",
  },
  media: {
    icon: Clapperboard,
    tint: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    ring: "hover:ring-rose-500/25",
  },
  convert: {
    icon: ArrowLeftRight,
    tint: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
    ring: "hover:ring-amber-500/25",
  },
  text: {
    icon: Type,
    tint: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    ring: "hover:ring-emerald-500/25",
  },
};

function ToolCard({
  toolId,
  category,
  icon: Icon,
  name,
  description,
  fav,
  onToggleFav,
  favoriteLabel,
  unfavoriteLabel,
}: {
  toolId: string;
  category: string;
  icon: typeof FileText;
  name: string;
  description: string;
  fav: boolean;
  onToggleFav: () => void;
  favoriteLabel: string;
  unfavoriteLabel: string;
}) {
  return (
    <Card className="group relative h-full overflow-hidden border-border/50 bg-card/90 shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]">
      <button
        type="button"
        className={cn(
          "absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          fav
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFav();
        }}
        aria-label={fav ? unfavoriteLabel : favoriteLabel}
      >
        <Star className={cn("h-4 w-4", fav && "fill-current")} />
      </button>
      <Link href={`/tools/${toolId}`} className="block h-full focus-visible:outline-none">
        <CardHeader className="space-y-3 p-4 sm:p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="pr-8">
            <CardTitle className="text-[15px] leading-snug tracking-tight">{name}</CardTitle>
            <CardDescription className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed">
              {description}
            </CardDescription>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{category}</span>
        </CardHeader>
      </Link>
    </Card>
  );
}

export function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("categories");
  const tcommon = useTranslations("common");
  const tt = useTranslations("tools");
  const tn = useTranslations("nav");
  const [q, setQ] = useState("");
  const [selectedCat, setSelectedCat] = useState<ToolCategory | null>(null);
  const favIds = useFavoritesStore((s) => s.ids);
  const toggle = useFavoritesStore((s) => s.toggle);

  const query = q.trim().toLowerCase();
  const isSearching = query.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return tools.filter((tool) => {
      const name = tt(`${tool.id}.name`).toLowerCase();
      const desc = tt(`${tool.id}.description`).toLowerCase();
      const kw = tt(`${tool.id}.keywords`).toLowerCase();
      return (
        name.includes(query) ||
        desc.includes(query) ||
        kw.includes(query) ||
        tool.id.includes(query)
      );
    });
  }, [isSearching, query, tt]);

  const categoryTools = useMemo(() => {
    if (!selectedCat) return [];
    return tools.filter((tool) => tool.category === selectedCat);
  }, [selectedCat]);

  const pinned = tools.filter((x) => favIds.includes(x.id));

  const showCategories = !isSearching && !selectedCat;
  const showCategoryTools = !isSearching && selectedCat !== null;
  const showSearch = isSearching;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero — generous, calm, Apple-like spacing without copying Apple type/fonts */}
      <section className="space-y-4 pt-1 sm:pt-2">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl sm:leading-[1.15]">
            {t("title")}
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="kit-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tn("searchPlaceholder")}
            className="h-12 rounded-2xl border-border/60 bg-card pl-11 pr-4 shadow-sm"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
      </section>

      {/* Pinned — only on category overview to reduce noise */}
      {showCategories && pinned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {t("pinned")}
          </h2>
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={`/tools/${tool.id}`} className="block">
                  <Card className="h-full border-border/50 transition-shadow hover:shadow-md">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <CardTitle className="truncate text-sm font-medium">
                        {tt(`${tool.id}.name`)}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Category picker */}
      {showCategories && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
              {t("chooseCategory")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("chooseCategoryHint")}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const meta = categoryMeta[c];
              const Icon = meta.icon;
              const count = tools.filter((x) => x.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCat(c)}
                  className={cn(
                    "group rounded-3xl border border-border/50 bg-card p-5 text-left shadow-sm transition-[transform,box-shadow,ring] duration-200",
                    "hover:-translate-y-0.5 hover:shadow-md hover:ring-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "active:scale-[0.99]",
                    meta.ring
                  )}
                >
                  <span
                    className={cn(
                      "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl",
                      meta.tint
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-base font-semibold tracking-tight">{tc(c)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {tc(`${c}Desc`)}
                  </p>
                  <p className="mt-3 text-xs font-medium text-muted-foreground/90">
                    {t("toolsInCategory", { count })}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Tools inside a category */}
      {showCategoryTools && selectedCat && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-9 gap-1 rounded-full px-2 text-muted-foreground"
                onClick={() => setSelectedCat(null)}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("backToCategories")}
              </Button>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {tc(selectedCat)}
              </h2>
              <p className="text-sm text-muted-foreground">{tc(`${selectedCat}Desc`)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categoryTools.map((tool) => (
              <ToolCard
                key={tool.id}
                toolId={tool.id}
                category={tc(tool.category)}
                icon={tool.icon}
                name={tt(`${tool.id}.name`)}
                description={tt(`${tool.id}.description`)}
                fav={favIds.includes(tool.id)}
                onToggleFav={() => toggle(tool.id)}
                favoriteLabel={tcommon("favorite")}
                unfavoriteLabel={tcommon("unfavorite")}
              />
            ))}
          </div>
        </section>
      )}

      {/* Global search results */}
      {showSearch && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("searchResults")}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({searchResults.length})
            </span>
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((tool) => (
                <ToolCard
                  key={tool.id}
                  toolId={tool.id}
                  category={tc(tool.category)}
                  icon={tool.icon}
                  name={tt(`${tool.id}.name`)}
                  description={tt(`${tool.id}.description`)}
                  fav={favIds.includes(tool.id)}
                  onToggleFav={() => toggle(tool.id)}
                  favoriteLabel={tcommon("favorite")}
                  unfavoriteLabel={tcommon("unfavorite")}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
