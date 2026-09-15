import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { tools, getTool, legacyToolIdMap, type ToolId } from "@/lib/tools/registry";
import { pathLocales } from "@/lib/i18n/config";
import { ToolPageClient } from "@/components/tools/tool-page-client";
import { ToolIntro } from "@/components/tools/tool-intro";
import { ToolGuide } from "@/components/tools/tool-guide";
import { ToolJsonLd } from "@/lib/seo/json-ld";
import { buildToolMetadata, toolJsonLdInput } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; toolId: string }>;
}): Promise<Metadata> {
  const { locale, toolId } = await params;
  return buildToolMetadata(locale, toolId);
}

export function generateStaticParams() {
  const toolIds = [...tools.map((tool) => tool.id), ...Object.keys(legacyToolIdMap)];
  return pathLocales.flatMap((locale) =>
    toolIds.map((toolId) => ({
      locale,
      toolId,
    }))
  );
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; toolId: string }>;
}) {
  const { locale, toolId } = await params;
  setRequestLocale(locale);
  const tool = getTool(toolId);
  if (!tool) notFound();
  const id = tool.id as ToolId;
  const jsonLd = await toolJsonLdInput(locale, toolId);
  /* Heading, then the tool, then what surrounds it. The heading and the guide
     are what a crawler is given; the tool in between needs a browser and is
     rendered on the client, where it can do something. */
  return (
    <>
      <ToolIntro toolId={id} />
      <ToolPageClient toolId={id} />
      <ToolGuide toolId={id} />
      {jsonLd ? <ToolJsonLd {...jsonLd} /> : null}
    </>
  );
}
