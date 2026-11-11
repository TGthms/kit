import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { omitHomeGreetingMessages, slimMessagesForShell } from "@/lib/i18n/slim";
import type { Metadata } from "next";
import { buildSectionMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildSectionMetadata(locale, "settings");
}

export default async function SettingsLayout({ children, params }: { children: React.ReactNode; params: Promise<{locale: string}> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  return <NextIntlClientProvider messages={{ ...omitHomeGreetingMessages(slimMessagesForShell(messages)), how: { title: (messages.how as {title: string}).title } }}>{children}</NextIntlClientProvider>;
}
