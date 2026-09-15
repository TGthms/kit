import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pathLocales } from "@/lib/i18n/config";
import { ToolPageClient } from "@/components/tools/tool-page-client";
import { ToolIntro } from "@/components/tools/tool-intro";
import { ToolGuide } from "@/components/tools/tool-guide";
import { ToolJsonLd } from "@/lib/seo/json-ld";
import { buildToolMetadata, toolJsonLdInput, toolSubtitle } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildToolMetadata(locale, "timezone-converter", "world-clock");
}

export function generateStaticParams() {
  return pathLocales.map((locale) => ({ locale }));
}

export default async function WorldClockPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const jsonLd = await toolJsonLdInput(locale, "timezone-converter", "world-clock");
  const subtitle = await toolSubtitle(locale, "timezone-converter");
  return (
    <>
      <ToolIntro toolId="timezone-converter" subtitle={subtitle} />
      <ToolPageClient toolId="timezone-converter" />
      <ToolGuide toolId="timezone-converter" />
      {jsonLd ? <ToolJsonLd {...jsonLd} /> : null}
    </>
  );
}
