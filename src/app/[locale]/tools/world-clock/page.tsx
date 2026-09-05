import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pathLocales } from "@/lib/i18n/config";
import { ToolPageClient } from "@/components/tools/tool-page-client";
import { ToolJsonLd } from "@/lib/seo/json-ld";
import { buildToolMetadata, toolJsonLdInput } from "@/lib/seo/metadata";

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
  return (
    <>
      <ToolPageClient toolId="timezone-converter" />
      {jsonLd ? <ToolJsonLd {...jsonLd} /> : null}
    </>
  );
}
