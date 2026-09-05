"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Search,
  Star,
  FileText,
  ImageIcon,
  Clapperboard,
  AudioLines,
  Database,
  Type,
  Code2,
  Calculator,
  ArrowLeftRight,
} from "lucide-react";
import { tools, categories, featuredToolIds, groupedTools, type ToolCategory, type ToolId } from "@/lib/tools/registry";
import { homeHref, parseCategoryParam, parseCategoryPath, rewriteCategoryQuery, toolHref } from "@/lib/navigation/routes";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useFavoritesStore } from "@/stores/favorites-store";
import { cn } from "@/lib/utils";
import { GreetingHeadline } from "@/components/home/greeting-headline";
import { GreetingSubtitle } from "@/components/home/greeting-subtitle";
import { GreetingSubtitleText } from "@/components/home/greeting-subtitle-text";
import { NewYearCard } from "@/components/home/new-year-card";
import { NewYearFireworks } from "@/components/home/new-year-fireworks";
import { PageLoader } from "@/components/shared/page-loader";
import { getGreetingPeriod, getGreetingPoolKeys, getGreetingVariant, getGreetingVisitSeed, getHomeGreetingSelection, type GreetingCategory, type GreetingPeriod, type GreetingSubtitle as GreetingSubtitlePick } from "@/lib/home/greeting";
import { greetingSearchFromLocation, overlayGreetingDate, readGreetingPreview, virtualGreetingNow } from "@/lib/home/greeting-qa";
import { getNewYearCardState, nextNewYearTickMs, NEW_YEAR_FIREWORKS_MS, shouldBurstNewYearFireworks, shouldPlayNewYearFireworks, type NewYearCardState } from "@/lib/home/new-year";
import type { SubtitleMotion } from "@/lib/home/subtitle-motion";
import { WEB_VERSES } from "@/lib/home/verses";

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
  data: {
    icon: Database,
    tint: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
    ring: "hover:ring-amber-500/20",
  },
  text: {
    icon: Type,
    tint: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    ring: "hover:ring-emerald-500/20",
  },
  developer: {
    icon: Code2,
    tint: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
    ring: "hover:ring-slate-500/25",
  },
  everyday: {
    icon: Calculator,
    tint: "bg-orange-500/12 text-orange-700 dark:text-orange-400",
    ring: "hover:ring-orange-500/25",
  },
  converter: {
    icon: ArrowLeftRight,
    tint: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-400",
    ring: "hover:ring-cyan-500/25",
  },
};

function ToolCard({
  toolId,
  category,
  fromHref = "/",
  icon: Icon,
  name,
  description,
  fav,
  onToggleFav,
  favoriteLabel,
  unfavoriteLabel,
  showFavorite = true,
  href,
}: {
  toolId: ToolId;
  category: string;
  fromHref?: string;
  icon: typeof FileText;
  name: string;
  description: string;
  fav: boolean;
  onToggleFav: () => void;
  favoriteLabel: string;
  unfavoriteLabel: string;
  showFavorite?: boolean;
  href?: string;
}) {
  return (
    <Card
      data-pressable
      className="group relative h-full overflow-hidden border-border/40 bg-card/95 pressable-soft transition-[transform,box-shadow] duration-200 hover:surface-float-lg"
    >
      {showFavorite ? <button
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
      </button> : null}
      <Link href={href ?? toolHref(toolId, fromHref)} className="block h-full focus-visible:outline-none">
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
  const locale = useLocale();
  const tc = useTranslations("categories");
  const tcommon = useTranslations("common");
  const tt = useTranslations("tools");
  const tn = useTranslations("nav");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedCat =
    parseCategoryPath(pathname) ?? parseCategoryParam(searchParams.get("c"));
  const greetingSearch = greetingSearchFromLocation(searchParams);
  const greetingPreview = readGreetingPreview(greetingSearch);
  const greetingDateParam = greetingSearch.get("date") ?? greetingSearch.get("greetingDate");
  const greetingSeedParam = greetingSearch.get("greetingSeed");
  const greetingTimeParam = greetingSearch.get("time") ?? greetingSearch.get("greetingTime");
  const showPreviewGreeting =
    greetingPreview.date !== null || greetingPreview.time !== null || greetingPreview.seed !== null;
  const [q, setQ] = useState("");
  const [newYear, setNewYear] = useState<NewYearCardState | null>(null);
  const [fireworksOn, setFireworksOn] = useState(false);
  const [fireworksBurst, setFireworksBurst] = useState(false);
  const [fireworksDuration, setFireworksDuration] = useState(NEW_YEAR_FIREWORKS_MS);
  useEffect(() => {
    rewriteCategoryQuery();
  }, []);

  const fireworksArmed = useRef(false);
  const fireworksVisit = useRef(false);
  const clockOrigin = useRef<{ wall: Date; wallMs: number } | null>(null);
  const getNowRef = useRef<() => Date>(() => new Date());
  const getNow = useCallback(() => getNowRef.current(), []);
  const [greeting, setGreeting] = useState<{
    period: GreetingPeriod;
    day: string;
    variant: number;
    greetingKey: string;
    subtitle: GreetingSubtitlePick;
    motion: SubtitleMotion;
    occasionKey?: string;
    category: GreetingCategory;
  } | null>(null);

  useLayoutEffect(() => {
    const { date: dateOverride, time: timeOverride, seed: seedOverride } = greetingPreview;
    const visitSeed = seedOverride ?? getGreetingVisitSeed();
    clockOrigin.current = timeOverride ? { wall: new Date(), wallMs: Date.now() } : null;
    let timeout = 0;
    const readNow = () => {
      const wall = new Date();
      if (!timeOverride || !clockOrigin.current) return overlayGreetingDate(wall, dateOverride, null);
      return virtualGreetingNow(clockOrigin.current.wall, dateOverride, timeOverride, {
        wallMs: clockOrigin.current.wallMs,
        nowMs: Date.now(),
      });
    };
    getNowRef.current = readNow;
    const updateGreeting = () => {
      const now = readNow();
      const card = getNewYearCardState(now);
      setNewYear(card.phase === "hidden" ? null : card);
      const playFireworks = shouldPlayNewYearFireworks(card);
      if (playFireworks && !fireworksArmed.current) {
        fireworksArmed.current = true;
        setFireworksDuration(Math.max(0, NEW_YEAR_FIREWORKS_MS - card.msSinceStart));
      }
      if (!playFireworks) fireworksArmed.current = false;
      if (playFireworks) fireworksVisit.current = true;
      const playBurst = shouldBurstNewYearFireworks(card) && !fireworksVisit.current;
      if (playBurst) fireworksVisit.current = true;
      if (card.phase !== "celebrate") fireworksVisit.current = false;
      setFireworksOn(playFireworks);
      if (playBurst) setFireworksBurst(true);
      if (card.phase !== "celebrate") setFireworksBurst(false);
      const skip = card.phase === "hidden" ? [] : ["newYear"];
      const pool = getGreetingPoolKeys(now);
      const variant = getGreetingVariant(now, pool.length, visitSeed);
      const selection = getHomeGreetingSelection(now, locale, variant, { skipOccasionKeys: skip });
      setGreeting({
        period: getGreetingPeriod(now),
        day: selection.day,
        variant,
        greetingKey: selection.greetingKey,
        subtitle: selection.subtitle,
        motion: selection.motion,
        occasionKey: selection.occasionKey,
        category: selection.category,
      });
      const cardWait = nextNewYearTickMs(card, now);
      const next = new Date(now);
      const hour = now.getHours();
      if (hour < 5) next.setHours(5, 0, 0, 0);
      else if (hour < 12) next.setHours(12, 0, 0, 0);
      else if (hour < 17) next.setHours(17, 0, 0, 0);
      else if (hour < 22) next.setHours(22, 0, 0, 0);
      else { next.setDate(next.getDate() + 1); next.setHours(5, 0, 0, 0); }
      const periodWait = Math.max(1000, next.getTime() - now.getTime() + 100);
      // Phase changes only (23:50, midnight, fireworks end, 2 Jan). The card
      // owns the countdown clock so home does not re-render 4×/s.
      timeout = window.setTimeout(updateGreeting, cardWait > 0 ? Math.min(cardWait, periodWait) : periodWait);
    };
    updateGreeting();
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- query strings are the identity; preview objects are new each render
  }, [greetingDateParam, greetingSeedParam, greetingTimeParam, locale]);

  const favIds = useFavoritesStore((s) => s.ids);
  const toggle = useFavoritesStore((s) => s.toggle);

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
  const showGreetingBlock = showCategories || showGlobalSearch || showPreviewGreeting;
  return (
    <div className="space-y-7 sm:space-y-9">
      <NewYearFireworks continuous={fireworksOn} burst={fireworksBurst} durationMs={fireworksDuration} />
      {newYear ? (
        <NewYearCard
          key={`${greetingDateParam}:${greetingTimeParam}`}
          state={newYear}
          getNow={getNow}
          heading={showCategoryTools ? "p" : "h1"}
        />
      ) : null}
      {showGreetingBlock && (
        <section className="space-y-4 pt-0.5 sm:pt-1">
          <div className="max-w-2xl space-y-2">
            {greeting ? (
              <GreetingHeadline
                key={`${greeting.greetingKey}:${greeting.day}`}
                as={newYear || showCategoryTools ? "h2" : "h1"}
                className="type-display text-foreground"
                text={t(greeting.greetingKey, { day: greeting.day, occasion: greeting.occasionKey ? t(`occasionLabel.${greeting.occasionKey}`) : "" })}
              />
            ) : newYear ? (
              <h2 className="type-display text-foreground">{t("title")}</h2>
            ) : showCategoryTools ? (
              <p className="type-display text-foreground">{t("title")}</p>
            ) : (
              <h1 className="type-display text-foreground">{t("title")}</h1>
            )}
            {greeting ? (
              <GreetingSubtitle
                key={`${greeting.greetingKey}:${greeting.day}:sub`}
                className="type-body max-w-xl text-muted-foreground"
                motion={greeting.motion}
              >
                {greeting.subtitle.kind === "verse" ? (
                  <>
                    <span>{WEB_VERSES[greeting.subtitle.id].text}</span>{" "}
                    <cite className="not-italic text-muted-foreground/80">{WEB_VERSES[greeting.subtitle.id].citation}</cite>
                  </>
                ) : (
                  <GreetingSubtitleText
                    subtitleKey={greeting.subtitle.key}
                    day={greeting.day}
                    occasion={greeting.occasionKey ? t(`occasionLabel.${greeting.occasionKey}`) : ""}
                  />
                )}
              </GreetingSubtitle>
            ) : (
              <p className="type-body max-w-xl text-muted-foreground">{t("subtitle")}</p>
            )}
          </div>
          {(showCategories || showGlobalSearch) && (
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="kit-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tn("searchPlaceholder")}
                aria-label={tn("searchPlaceholder")}
                className="h-11 rounded-[14px] border-border/40 bg-card/95 ps-11 pe-4 surface-float sm:h-12 sm:rounded-2xl"
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
          )}
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
                <Link key={tool.id} href={toolHref(tool.id)} className="block" data-pressable>
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
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {t("featured")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredToolIds.map((id) => {
              const tool = tools.find((x) => x.id === id);
              if (!tool) return null;
              const Icon = tool.icon;
              return (
                <Link key={id} href={toolHref(id)} className="block" data-pressable>
                  <Card className="h-full border-border/40 pressable-soft transition-shadow hover:surface-float-lg">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-sm font-medium tracking-[-0.01em]">
                          {tt(`${id}.name`)}
                        </CardTitle>
                        <CardDescription className="mt-0.5 line-clamp-2 text-xs">
                          {tt(`${id}.description`)}
                        </CardDescription>
                      </div>
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
                <Link
                  key={c}
                  href={homeHref(c)}
                  data-pressable
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={cn(
                    "anim-list-item group block rounded-[1.25rem] border border-border/40 bg-card p-5 text-left surface-float",
                    "pressable transition-[box-shadow,ring] duration-200",
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
                </Link>
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
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="kit-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tn("searchPlaceholder")}
              aria-label={tn("searchPlaceholder")}
              className="h-11 rounded-[14px] border-border/40 bg-card/95 ps-11 pe-4 surface-float"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          {categoryTools.length === 0 ? (
            <p className="type-body text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="space-y-8">
              {groupedTools(selectedCat)
                .map((block) => ({
                  ...block,
                  tools: block.tools.filter((tool) => matchesQuery(tool.id)),
                }))
                .filter((block) => block.tools.length > 0)
                .map((block) => (
                  <div key={block.group} className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {t(`groups.${block.group}`)}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {block.tools.map((tool, index) => (
                        <div
                          key={tool.id}
                          className="anim-list-item"
                          style={{ animationDelay: `${index * 35}ms` }}
                        >
                          <ToolCard
                            toolId={tool.id}
                            category={tc(tool.category)}
                            fromHref={homeHref(selectedCat)}
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
                    fromHref="/"
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
  const tcommon = useTranslations("common");
  return (
    <Suspense fallback={<PageLoader label={tcommon("loading")} />}>
      <HomePageInner />
    </Suspense>
  );
}
