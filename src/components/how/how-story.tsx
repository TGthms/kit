"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  File,
  Gauge,
  HardDrive,
  MonitorSmartphone,
  ShieldCheck,
  WifiOff,
  Zap,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HOW_FAQ_KEYS, HOW_GREETING_BOUNDS, HOW_MEDIA_ENGINE_MB } from "@/lib/how/facts";
import { LaneDiagram } from "./lane-diagram";
import { NetworkCheck } from "./network-check";

const COMPARE_ROWS = [
  ["rowFile", "typicalFile", "kitFile"],
  ["rowResult", "typicalResult", "kitResult"],
  ["rowAccount", "typicalAccount", "kitAccount"],
  ["rowTracking", "typicalTracking", "kitTracking"],
  ["rowProcessing", "typicalProcessing", "kitProcessing"],
  ["rowCurrency", "typicalCurrency", "kitCurrency"],
  ["rowAfter", "typicalAfter", "kitAfter"],
] as const;

const SIZE_ROWS = [
  ["sizeUi", "sizeUiBody"],
  ["sizePdf", "sizePdfBody"],
  ["sizeMedia", "sizeMediaBody"],
  ["sizeRates", "sizeRatesBody"],
] as const;

const GREET_ITEMS = [
  ["greetClock", "greetClockBody"],
  ["greetWeek", "greetWeekBody"],
  ["greetDays", "greetDaysBody"],
  ["greetSub", "greetSubBody"],
  ["greetNewYear", "greetNewYearBody"],
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

const DEVICE_LANES = ["lanesDeviceFile", "lanesDeviceAmount", "lanesDevicePrefs"] as const;
const NETWORK_LANES = ["lanesNetworkApp", "lanesNetworkRates", "lanesNetworkHost"] as const;

const WHY_ITEMS = [
  { title: "whyPrivate", body: "whyPrivateBody", icon: ShieldCheck },
  { title: "whyFast", body: "whyFastBody", icon: Zap },
  { title: "whyCaps", body: "whyCapsBody", icon: Gauge },
  { title: "whyOffline", body: "whyOfflineBody", icon: WifiOff },
] as const;

const TOC_ITEMS = [
  ["compareTitle", "#how-compare-heading"],
  ["whyTitle", "#how-why-heading"],
  ["exampleTitle", "#how-example-heading"],
  ["sizeTitle", "#how-size-heading"],
  ["techTitle", "#how-tech-heading"],
  ["verifyTitle", "#how-verify-heading"],
  ["faqTitle", "#how-faq-heading"],
] as const;

function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </h2>
      {lede ? <p className="type-body max-w-2xl text-muted-foreground">{lede}</p> : null}
      {children}
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
      <summary className="cursor-pointer select-none font-medium text-foreground">{question}</summary>
      <p className="anim-details-content mt-2 leading-relaxed text-muted-foreground">{answer}</p>
    </details>
  );
}

export function HowStory({ toolCount, languageCount }: { toolCount: number; languageCount: number }) {
  const t = useTranslations("how");

  // Keys carrying values derived from the repo itself, so copy cannot drift.
  const tr = (key: string): string => {
    switch (key) {
      case "statsTools":
      case "exampleNote":
        return t(key, { count: toolCount });
      case "statsLangs":
        return t(key, { count: languageCount });
      case "techUiJob":
        return t(key, { langs: languageCount });
      case "sizeMediaBody":
      case "faqMediaQ":
      case "limitMedia":
        return t(key, { mediaMb: HOW_MEDIA_ENGINE_MB });
      case "greetClockBody":
        return t(key, {
          h1: HOW_GREETING_BOUNDS.morningStart,
          h2: HOW_GREETING_BOUNDS.morningEnd,
          h3: HOW_GREETING_BOUNDS.afternoonEnd,
          h4: HOW_GREETING_BOUNDS.eveningEnd,
        });
      default:
        return t(key);
    }
  };

  return (
    <div className="space-y-10">
      <p className="type-body max-w-2xl text-muted-foreground">{t("lede")}</p>

      <div>
        <div role="group" aria-label={t("statsAria")} className="grid gap-3 sm:grid-cols-3">
          {["statsTools", "statsLangs", "statsUploads"].map((key) => (
            <div key={key} className="rounded-2xl border border-border/50 bg-card px-4 py-5 text-center surface-float">
              <p className="type-title tabular-nums text-foreground">{tr(key)}</p>
            </div>
          ))}
        </div>
        <p className="type-caption mt-3 text-muted-foreground">{t("statsNote")}</p>
      </div>

      <nav aria-label={t("tocAria")} className="rounded-2xl border border-border/50 bg-card px-4 py-3 surface-float">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {TOC_ITEMS.map(([key, href]) => (
            <li key={key}>
              <a
                href={href}
                className="type-caption text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t(key)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="how-compare" title={t("compareTitle")}>
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
      </Section>

      <Section id="how-path" title={t("pathTitle")}>
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
      </Section>

      <Section id="how-lanes" title={t("lanesTitle")}>
        <LaneDiagram />
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{t("lanesDevice")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
                {DEVICE_LANES.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{t("lanesNetwork")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
                {NETWORK_LANES.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <p className="type-caption text-muted-foreground">{t("lanesNote")}</p>
      </Section>

      <Section id="how-why" title={t("whyTitle")} lede={t("whyLede")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-border/50">
                <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <CardTitle className="text-base">{t(item.title)}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(item.body)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section id="how-example" title={t("exampleTitle")} lede={t("exampleLede")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{t("exampleMergeHeading")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
                {(["exampleMerge1", "exampleMerge2", "exampleMerge3", "exampleMerge4"] as const).map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{t("examplePasswordHeading")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
                {(["examplePassword1", "examplePassword2", "examplePassword3"] as const).map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
        <p className="type-caption text-muted-foreground">{tr("exampleNote")}</p>
      </Section>

      <Section id="how-size" title={t("sizeTitle")}>
        <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card surface-float">
          <table className="w-full min-w-[28rem] text-start text-sm">
            <caption className="sr-only">{t("sizeTitle")}</caption>
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("sizeWhat")}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("sizeDetail")}
                </th>
              </tr>
            </thead>
            <tbody>
              {SIZE_ROWS.map(([label, body]) => (
                <tr key={label} className="border-b border-border/40 last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium text-foreground">
                    {t(label)}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{tr(body)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="type-caption text-muted-foreground">{t("sizeNote")}</p>
      </Section>

      <Section id="how-tech" title={t("techTitle")}>
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
                    {tr(job)}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{t(runs)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t(where)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="how-verify" title={t("verifyTitle")} lede={t("verifyLede")}>
        <NetworkCheck />
      </Section>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{t("exceptionTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("exceptionBody")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("hostNote")}</p>
          <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed text-muted-foreground">
            <li>{t("limitLarge")}</li>
            <li>{tr("limitMedia")}</li>
            <li>{t("limitBrowser")}</li>
          </ul>
        </CardContent>
      </Card>

      <Section id="how-stays" title={t("staysTitle")}>
        <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
          <li>{t("staysFiles")}</li>
          <li>{t("staysHistory")}</li>
          <li>{t("staysPrefs")}</li>
          <li>{t("staysClear")}</li>
        </ul>
      </Section>

      <Section id="how-offline" title={t("offlineTitle")}>
        <p className="type-body max-w-2xl text-muted-foreground">{t("offlineBody")}</p>
      </Section>

      <Section id="how-faq" title={t("faqTitle")}>
        <div className="space-y-2">
          {HOW_FAQ_KEYS.map(([questionKey, answerKey]) => (
            <FaqItem key={questionKey} question={tr(questionKey)} answer={tr(answerKey)} />
          ))}
        </div>
      </Section>

      <details className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
        <summary className="cursor-pointer select-none font-medium text-foreground">{t("greetTitle")}</summary>
        <div className="anim-details-content mt-3 space-y-3">
          <p className="type-body text-muted-foreground">{t("greetLede")}</p>
          <dl className="space-y-4">
            {GREET_ITEMS.map(([term, body]) => (
              <div key={term} className="space-y-1">
                <dt className="font-medium text-foreground">{t(term)}</dt>
                <dd className="leading-relaxed text-muted-foreground">{tr(body)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>{t("ctaTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("ctaBody")}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/tools/pdf-merge">{t("ctaMerge")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tools/password-generator">{t("ctaPassword")}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/tools">{t("ctaBrowse")}</Link>
            </Button>
          </div>
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
