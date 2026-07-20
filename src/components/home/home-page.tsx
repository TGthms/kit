"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  Star,
  FileText,
  ImageIcon,
  Clapperboard,
  AudioLines,
  ArrowLeftRight,
  Type,
} from "lucide-react";
import { tools, categories, type ToolCategory } from "@/lib/tools/registry";
import { homeHref, parseCategoryParam } from "@/lib/navigation/routes";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useFavoritesStore } from "@/stores/favorites-store";
import { cn } from "@/lib/utils";

const categoryMeta: Record<
  ToolCategory,
  { icon: typeof FileText; tint: string; ring: string }
> = {
  pdf: {
    icon: FileText,
    tint: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    ring: "hover:ring-sky-500/20",
  },
  image: {
    icon: ImageIcon,
    tint: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    ring: "hover:ring-violet-500/20",
  },
  audio: {
    icon: AudioLines,
    tint: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400",
    ring: "hover:ring-fuchsia-500/20",
  },
  video: {
    icon: Clapperboard,
    tint: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    ring: "hover:ring-rose-500/20",
  },
  convert: {
    icon: ArrowLeftRight,
    tint: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
    ring: "hover:ring-amber-500/20",
  },
  text: {
    icon: Type,
    tint: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    ring: "hover:ring-emerald-500/20",
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
    <Card
      data-pressable
      className="group relative h-full overflow-hidden border-border/40 bg-card/95 pressable-soft transition-[transform,box-shadow] duration-200 hover:surface-float-lg"
    >
      <button
        type="button"
        className={cn(
          "absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full pressable",
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
            <CardTitle className="text-[15px] leading-snug tracking-[-0.012em]">{name}</CardTitle>
            <CardDescription className="mt-1.5 line-clamp-2 type-caption text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          <span className="text-xs font-medium tracking-[-0.01em] text-muted-foreground">
            {category}
          </span>
        </CardHeader>
      </Link>
    </Card>
  );
}

function HomePageInner() {
  const t = useTranslations("home");
  const tc = useTranslations("categories");
  const tcommon = useTranslations("common");
  const tt = useTranslations("tools");
  const tn = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCat = parseCategoryParam(searchParams.get("c"));
  const [q, setQ] = useState("");

  const favIds = useFavoritesStore((s) => s.ids);
  const toggle = useFavoritesStore((s) => s.toggle);

  const openCategory = useCallback(
    (c: ToolCategory) => {
      router.push(homeHref(c));
    },
    [router]
  );

  const query = q.trim().toLowerCase();
  const isSearching = query.length > 0;

  const matchesQuery = useCallback(
    (toolId: string) => {
      if (!isSearching) return true;
      const name = tt(`${toolId}.name`).toLowerCase();
      const desc = tt(`${toolId}.description`).toLowerCase();
      const kw = tt(`${toolId}.keywords`).toLowerCase();
      return (
        name.includes(query) ||
        desc.includes(query) ||
        kw.includes(query) ||
        toolId.includes(query)
      );
    },
    [isSearching, query, tt]
  );

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return tools.filter((tool) => matchesQuery(tool.id));
  }, [isSearching, matchesQuery]);

  const categoryTools = useMemo(() => {
    if (!selectedCat) return [];
    return tools.filter(
      (tool) => tool.category === selectedCat && matchesQuery(tool.id)
    );
  }, [selectedCat, matchesQuery]);

  const pinned = tools.filter((x) => favIds.includes(x.id));
  const showCategories = !isSearching && !selectedCat;
  const showCategoryTools = selectedCat !== null;
  const showGlobalSearch = isSearching && !selectedCat;

  return (
    <div className="space-y-7 sm:space-y-9">
      {(showCategories || showGlobalSearch) && (
        <section className="space-y-4 pt-0.5 sm:pt-1">
          <div className="max-w-2xl space-y-2">
            <h1 className="type-display text-foreground">{t("title")}</h1>
            <p className="type-body max-w-xl text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="kit-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tn("searchPlaceholder")}
              className="h-11 rounded-[14px] border-border/40 bg-card/95 pl-11 pr-4 surface-float sm:h-12 sm:rounded-2xl"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
        </section>
      )}

      {showCategories && pinned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {t("pinned")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={`/tools/${tool.id}`} className="block" data-pressable>
                  <Card className="h-full border-border/40 pressable-soft transition-shadow hover:surface-float-lg">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <CardTitle className="truncate text-sm font-medium tracking-[-0.01em]">
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

      {showCategories && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="type-title text-foreground">{t("chooseCategory")}</h2>
            <p className="type-body text-muted-foreground">{t("chooseCategoryHint")}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, index) => {
              const meta = categoryMeta[c];
              const Icon = meta.icon;
              const count = tools.filter((x) => x.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  data-pressable
                  onClick={() => openCategory(c)}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={cn(
                    "anim-list-item group rounded-[1.25rem] border border-border/40 bg-card p-5 text-left surface-float",
                    "pressable transition-[transform,box-shadow,ring] duration-200",
                    "hover:surface-float-lg hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    meta.ring
                  )}
                >
                  <span
                    className={cn(
                      "mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-[1.04]",
                      meta.tint
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em]">{tc(c)}</h3>
                  <p className="mt-1.5 type-caption leading-relaxed text-muted-foreground">
                    {tc(`${c}Desc`)}
                  </p>
                  <p className="mt-3 text-xs font-medium tracking-[-0.01em] text-muted-foreground/90">
                    {t("toolsInCategory", { count })}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {showCategoryTools && selectedCat && (
        <section className="space-y-4">
          <PageHeader
            title={tc(selectedCat)}
            subtitle={tc(`${selectedCat}Desc`)}
            backHref={homeHref()}
            backLabel={t("backToCategories")}
          />
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="kit-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tn("searchPlaceholder")}
              className="h-11 rounded-[14px] border-border/40 bg-card/95 pl-11 pr-4 surface-float"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          {categoryTools.length === 0 ? (
            <p className="type-body text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categoryTools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="anim-list-item"
                  style={{ animationDelay: `${index * 35}ms` }}
                >
                  <ToolCard
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
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showGlobalSearch && (
        <section className="space-y-4">
          <h2 className="type-title text-foreground">
            {t("searchResults")}
            <span className="ml-2 text-sm font-normal tracking-normal text-muted-foreground">
              ({searchResults.length})
            </span>
          </h2>
          {searchResults.length === 0 ? (
            <p className="type-body text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((tool, index) => (
                <div
                  key={tool.id}
                  className="anim-list-item"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <ToolCard
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
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="type-body text-muted-foreground py-8">…</div>
      }
    >
      <HomePageInner />
    </Suspense>
  );
}
