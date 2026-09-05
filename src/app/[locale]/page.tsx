import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/home/home-page";
import { slimMessagesForShell } from "@/lib/i18n/slim";
import { buildLocaleMetadata } from "@/lib/seo/metadata";

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
  return (
    <NextIntlClientProvider messages={messages}>
      <HomePage />
    </NextIntlClientProvider>
  );
}
