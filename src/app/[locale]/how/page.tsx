import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { isPathLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/layout/legal-page-shell";
import { HowStory } from "@/components/how/how-story";
import { LegalJsonLd } from "@/lib/seo/json-ld";
import { buildSectionMetadata, legalJsonLdInput } from "@/lib/seo/metadata";

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

  return (
    <LegalPageShell title={t("title")} backHref="/" backLabel={tn("home")}>
      <HowStory />
      {jsonLd ? <LegalJsonLd {...jsonLd} /> : null}
    </LegalPageShell>
  );
}
