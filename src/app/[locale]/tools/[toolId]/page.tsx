import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { tools, getTool, legacyToolIdMap, type ToolId } from "@/lib/tools/registry";
import { pathLocales } from "@/lib/i18n/config";
import { ToolPageClient } from "@/components/tools/tool-page-client";
import { ToolIntro } from "@/components/tools/tool-intro";
import { ToolGuide } from "@/components/tools/tool-guide";
import { ToolJsonLd } from "@/lib/seo/json-ld";
import { buildToolMetadata, toolJsonLdInput, toolSubtitle } from "@/lib/seo/metadata";

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
  /* The sentence under the heading, resolved here rather than inside the
     component: the card label the client already carries is a different string,
     and only the server has the full catalog to read the sentence from. */
  const subtitle = await toolSubtitle(locale, toolId);
  /* Heading, then the tool, then what surrounds it. The heading and the guide
     are what a crawler is given; the tool in between needs a browser and is
     rendered on the client, where it can do something. */
  return (
    <>
      <ToolIntro toolId={id} subtitle={subtitle} />
      <ToolPageClient toolId={id} />
      <ToolGuide toolId={id} />
      {jsonLd ? <ToolJsonLd {...jsonLd} /> : null}
    </>
  );
}
