"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatedClock } from "@/components/shared/animated-clock";
import { Card, CardContent } from "@/components/ui/card";
import { GreetingHeadline } from "@/components/home/greeting-headline";
import { GreetingSubtitle } from "@/components/home/greeting-subtitle";
import { useLiveNewYearState } from "@/components/home/use-live-new-year";
import { countdownParts, countdownSubtitleKind, type NewYearCardState } from "@/lib/home/new-year";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function NewYearCard({
  state,
  getNow,
}: {
  state: NewYearCardState;
  getNow: () => Date;
}) {
  const t = useTranslations("home.newYearCard");
  const [reducedMotion] = useState(prefersReducedMotion);
  const live = useLiveNewYearState(state, getNow);
  const parts = countdownParts(live.msLeft);
  const countdown = live.phase === "countdown";
  const subtitleKind = countdownSubtitleKind(parts.minutes);
  const subtitle =
    subtitleKind === "minutes"
      ? t("countdownSubtitle", { minutes: parts.minutes })
      : subtitleKind === "minute"
        ? t("countdownSubtitleMinute")
        : t("countdownSubtitleSeconds");

  return (
    <Card
      className="overflow-hidden border-border/40 bg-card/95"
      data-new-year-card
      data-phase={live.phase}
    >
      <CardContent className="flex flex-col items-center gap-4 px-5 py-7 text-center sm:px-8 sm:py-9">
        {countdown ? (
          <>
            <GreetingHeadline
              key={`ny-count-${live.year}`}
              as="h1"
              className="type-title text-foreground"
              text={t("countdownTitle", { year: live.year })}
            />
            <AnimatedClock
              minutes={parts.minutes}
              seconds={parts.seconds}
              trend={-1}
              animate={!reducedMotion}
              className="text-[2.75rem] font-semibold tracking-[-0.04em] text-foreground sm:text-6xl"
              digitClassName="font-semibold"
              label={t("countdownLabel", {
                year: live.year,
                minutes: parts.minutes,
                seconds: parts.seconds,
              })}
            />
            <GreetingSubtitle
              key={subtitleKind}
              motion="fadeSlow"
              className="type-body max-w-md text-muted-foreground"
            >
              {subtitle}
            </GreetingSubtitle>
          </>
        ) : (
          <>
            <GreetingHeadline
              key={`ny-hi-${live.year}`}
              as="h1"
              className="type-display text-foreground"
              text={t("celebrateTitle", { year: live.year })}
            />
            <GreetingSubtitle motion="fade" className="type-body max-w-md text-muted-foreground">
              {t("celebrateSubtitle", { year: live.year })}
            </GreetingSubtitle>
          </>
        )}
      </CardContent>
    </Card>
  );
}
