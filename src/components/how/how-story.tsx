"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, File, HardDrive, MonitorSmartphone } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COMPARE_ROWS = [
  ["rowFile", "typicalFile", "kitFile"],
  ["rowAccount", "typicalAccount", "kitAccount"],
  ["rowTracking", "typicalTracking", "kitTracking"],
  ["rowProcessing", "typicalProcessing", "kitProcessing"],
  ["rowAfter", "typicalAfter", "kitAfter"],
] as const;

const TECH_ROWS = [
  ["techPdfJob", "techPdfRuns", "techPdfWhere"],
  ["techMediaJob", "techMediaRuns", "techMediaWhere"],
  ["techImageJob", "techImageRuns", "techImageWhere"],
  ["techCryptoJob", "techCryptoRuns", "techCryptoWhere"],
  ["techPwaJob", "techPwaRuns", "techPwaWhere"],
  ["techUiJob", "techUiRuns", "techUiWhere"],
] as const;

const PATH_STEPS = [
  { key: "pathOpen", icon: File },
  { key: "pathTool", icon: MonitorSmartphone },
  { key: "pathSave", icon: HardDrive },
] as const;

export function HowStory() {
  const t = useTranslations("how");

  return (
    <div className="space-y-8">
      <p className="type-body max-w-2xl text-muted-foreground">{t("lede")}</p>

      <section className="space-y-3" aria-labelledby="how-compare-heading">
        <h2 id="how-compare-heading" className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          {t("compareTitle")}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card surface-float">
          <table className="w-full min-w-[32rem] text-start text-sm">
            <caption className="sr-only">{t("compareTitle")}</caption>
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium" />
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("compareTypical")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-foreground">
                  {t("compareKit")}
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([label, typical, kit]) => (
                <tr key={label} className="border-b border-border/40 last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium text-foreground">
                    {t(label)}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{t(typical)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{t(kit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="how-path-heading">
        <h2 id="how-path-heading" className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          {t("pathTitle")}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
          {PATH_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.key} className="contents">
                <div className="flex gap-3 rounded-2xl border border-border/50 bg-card p-4 surface-float sm:flex-col sm:items-start">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="type-body pt-1.5 font-medium text-foreground">
                    <span className="me-2 text-muted-foreground">{index + 1}.</span>
                    {t(step.key)}
                  </p>
                </div>
                {index < PATH_STEPS.length - 1 ? (
                  <span className="hidden items-center justify-center text-muted-foreground sm:flex" aria-hidden>
                    <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="type-caption text-muted-foreground">{t("pathNote")}</p>
      </section>

      <section className="space-y-3" aria-labelledby="how-chart-heading">
        <h2 id="how-chart-heading" className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          {t("chartTitle")}
        </h2>
        <Card className="border-border/50">
          <CardContent className="space-y-5 p-5">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{t("chartTypical")}</p>
                <p className="text-sm tabular-nums text-muted-foreground">{t("chartTypicalValue")}</p>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-secondary"
                role="img"
                aria-label={`${t("chartTypical")}: ${t("chartTypicalValue")}`}
              >
                <div className="h-full w-full rounded-full bg-muted-foreground/55" />
              </div>
              <p className="type-caption text-muted-foreground">{t("chartTypicalCaption")}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{t("chartKit")}</p>
                <p className="text-sm tabular-nums text-muted-foreground">{t("chartKitValue")}</p>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-secondary"
                role="img"
                aria-label={`${t("chartKit")}: ${t("chartKitValue")}`}
              >
                <div className="h-full w-[3%] rounded-full bg-primary" />
              </div>
              <p className="type-caption text-muted-foreground">{t("chartKitCaption")}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3" aria-labelledby="how-tech-heading">
        <h2 id="how-tech-heading" className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          {t("techTitle")}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card surface-float">
          <table className="w-full min-w-[36rem] text-start text-sm">
            <caption className="sr-only">{t("techTitle")}</caption>
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("techJob")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("techRuns")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("techWhere")}
                </th>
              </tr>
            </thead>
            <tbody>
              {TECH_ROWS.map(([job, runs, where]) => (
                <tr key={job} className="border-b border-border/40 last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium text-foreground">
                    {t(job)}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{t(runs)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t(where)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="how-stays-heading">
        <h2 id="how-stays-heading" className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          {t("staysTitle")}
        </h2>
        <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
          <li>{t("staysFiles")}</li>
          <li>{t("staysHistory")}</li>
          <li>{t("staysPrefs")}</li>
          <li>{t("staysClear")}</li>
        </ul>
      </section>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{t("exceptionTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("exceptionBody")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("hostNote")}</p>
        </CardContent>
      </Card>

      <p className="type-caption text-muted-foreground">
        {t("legalLead")}{" "}
        <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
          {t("viewPrivacy")}
        </Link>
        {" · "}
        <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary">
          {t("viewTerms")}
        </Link>
      </p>
    </div>
  );
}
