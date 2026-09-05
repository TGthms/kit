import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/home/home-page";
import { slimMessagesForShell } from "@/lib/i18n/slim";
import { localeHtmlLang } from "@/lib/i18n/config";
import { HomeJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import { buildLocaleMetadata, canonicalLocale, isIndexablePathLocale } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildLocaleMetadata(locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = slimMessagesForShell(await getMessages());
  const meta = messages.meta as { description?: string };
  return (
    <NextIntlClientProvider messages={messages}>
      <HomePage />
      {isIndexablePathLocale(locale) ? (
        <HomeJsonLd
          description={meta.description ?? ""}
          locale={localeHtmlLang(locale)}
          url={absoluteUrl(`/${canonicalLocale(locale)}/`)}
        />
      ) : null}
    </NextIntlClientProvider>
  );
}
