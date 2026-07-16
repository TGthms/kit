import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/lib/i18n/config";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { ShortcutsProvider } from "@/components/layout/shortcuts-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#007aff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ShortcutsProvider>
              <AppShell>{children}</AppShell>
            </ShortcutsProvider>
            <ServiceWorkerRegister />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
