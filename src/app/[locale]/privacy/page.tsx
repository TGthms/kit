import { setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { loadLegal, renderSimpleMarkdown } from "@/lib/legal/load";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const md = loadLegal(locale as Locale, "privacy");
  const html = renderSimpleMarkdown(md);

  return (
    <article
      className="prose-kit mx-auto max-w-3xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
