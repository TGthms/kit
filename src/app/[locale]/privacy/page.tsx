import { setRequestLocale, getTranslations } from "next-intl/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { loadLegal, renderSimpleMarkdown } from "@/lib/legal/load";
import { LegalPageShell } from "@/components/layout/legal-page-shell";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const md = loadLegal(locale as Locale, "privacy");
  // Drop the H1 from markdown — PageHeader already shows the title
  const body = md.replace(/^#\s+.+\n+/, "");
  const html = renderSimpleMarkdown(body);

  return (
    <LegalPageShell title={t("privacyTitle")}>
      <article
        className="prose-kit text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </LegalPageShell>
  );
}
