import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { tools, getTool, legacyToolIdMap, type ToolId } from "@/lib/tools/registry";
import { pathLocales } from "@/lib/i18n/config";
import { ToolPageClient } from "@/components/tools/tool-page-client";
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
  const jsonLd = await toolJsonLdInput(locale, toolId);
  return (
    <>
      <ToolPageClient toolId={tool.id as ToolId} />
      {jsonLd ? <ToolJsonLd {...jsonLd} /> : null}
    </>
  );
}
