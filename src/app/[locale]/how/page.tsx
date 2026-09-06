import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { isPathLocale, locales } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { tools } from "@/lib/tools/registry";
import { LegalPageShell } from "@/components/layout/legal-page-shell";
import { HowStory } from "@/components/how/how-story";
import { HowJsonLd } from "@/lib/seo/json-ld";
import { buildSectionMetadata, faqJsonLdInput, legalJsonLdInput } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSectionMetadata(locale, "how");
}

export default async function HowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPathLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("how");
  const tn = await getTranslations("nav");
  const jsonLd = await legalJsonLdInput(locale, "how");
  const faq = await faqJsonLdInput(locale);

  return (
    <LegalPageShell title={t("title")} backHref="/" backLabel={tn("home")}>
      <HowStory toolCount={tools.length} languageCount={locales.length} />
      {jsonLd ? (
        <HowJsonLd {...jsonLd} questions={faq?.questions} />
      ) : null}
    </LegalPageShell>
  );
}
