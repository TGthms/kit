import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home/home-page";
import { slimMessagesForShell } from "@/lib/i18n/slim";
import { pathLocales } from "@/lib/i18n/config";
import { categories } from "@/lib/tools/registry";
import { parseCategoryParam } from "@/lib/navigation/routes";
import { LegalJsonLd } from "@/lib/seo/json-ld";
import { buildCategoryMetadata, categoryJsonLdInput } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  return buildCategoryMetadata(locale, category);
}

export function generateStaticParams() {
  return pathLocales.flatMap((locale) => categories.map((category) => ({ locale, category })));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  const parsed = parseCategoryParam(category);
  if (!parsed) notFound();
  setRequestLocale(locale);
  const messages = slimMessagesForShell(await getMessages());
  const jsonLd = await categoryJsonLdInput(locale, parsed);
  return (
    <NextIntlClientProvider messages={messages}>
      <HomePage />
      {jsonLd ? <LegalJsonLd {...jsonLd} /> : null}
    </NextIntlClientProvider>
  );
}
