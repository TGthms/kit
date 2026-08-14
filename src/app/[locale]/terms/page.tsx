import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { isPathLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { loadLegal, renderSimpleMarkdown } from "@/lib/legal/load";
import { LegalPageShell } from "@/components/layout/legal-page-shell";
import { buildSectionMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSectionMetadata(locale, "terms");
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPathLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const md = loadLegal(locale, "terms");
  const body = md.replace(/^#\s+.+\n+/, "");
  const html = renderSimpleMarkdown(body);

  return (
    <LegalPageShell title={t("termsTitle")}>
      <article
        className="prose-kit text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </LegalPageShell>
  );
}
