import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { tools, getTool, type ToolId } from "@/lib/tools/registry";
import { locales } from "@/lib/i18n/config";
import { ToolPageClient } from "@/components/tools/tool-page-client";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    tools.map((tool) => ({
      locale,
      toolId: tool.id,
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
  return <ToolPageClient toolId={tool.id as ToolId} />;
}
