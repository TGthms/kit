"use client";

import { useTranslations } from "next-intl";
import { AnimatedClock } from "@/components/shared/animated-clock";
import { Card, CardContent } from "@/components/ui/card";
import { GreetingHeadline } from "@/components/home/greeting-headline";
import { GreetingSubtitle } from "@/components/home/greeting-subtitle";
import { countdownParts, type NewYearCardState } from "@/lib/home/new-year";

export function NewYearCard({ state }: { state: NewYearCardState }) {
  const t = useTranslations("home.newYearCard");
  const parts = countdownParts(state.msLeft);
  const countdown = state.phase === "countdown";

  return (
    <Card
      className="overflow-hidden border-border/40 bg-card/95"
      data-new-year-card
      data-phase={state.phase}
    >
      <CardContent className="flex flex-col items-center gap-4 px-5 py-7 text-center sm:px-8 sm:py-9">
        {countdown ? (
          <>
            <GreetingHeadline
              key={`ny-count-${state.year}`}
              as="h2"
              className="type-title text-foreground"
              text={t("countdownTitle", { year: state.year })}
            />
            <AnimatedClock
              minutes={parts.minutes}
              seconds={parts.seconds}
              trend={-1}
              animate
              className="text-[2.75rem] font-semibold tracking-[-0.04em] text-foreground sm:text-6xl"
              digitClassName="font-semibold"
              label={t("countdownLabel", {
                year: state.year,
                minutes: parts.minutes,
                seconds: parts.seconds,
              })}
            />
            <GreetingSubtitle motion="fadeSlow" className="type-body max-w-md text-muted-foreground">
              {t("countdownSubtitle")}
            </GreetingSubtitle>
          </>
        ) : (
          <>
            <GreetingHeadline
              key={`ny-hi-${state.year}`}
              as="h2"
              className="type-display text-foreground"
              text={t("celebrateTitle", { year: state.year })}
            />
            <GreetingSubtitle motion="fade" className="type-body max-w-md text-muted-foreground">
              {t("celebrateSubtitle", { year: state.year })}
            </GreetingSubtitle>
          </>
        )}
      </CardContent>
    </Card>
  );
}
