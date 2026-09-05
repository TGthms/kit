import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { pathLocales, isPathLocale, localeDir, localeHtmlLang } from "@/lib/i18n/config";
import { omitHomeGreetingMessages, slimMessagesForShell } from "@/lib/i18n/slim";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { ShortcutsProvider } from "@/components/layout/shortcuts-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { NavigationGuard } from "@/components/layout/navigation-guard";
import { ChunkLoadRecovery } from "@/components/pwa/chunk-load-recovery";
import { DocumentHead } from "@/components/layout/document-head";

export function generateStaticParams() {
  return pathLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPathLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = omitHomeGreetingMessages(slimMessagesForShell(await getMessages()));
  const lang = localeHtmlLang(locale);
  const dir = localeDir(locale);

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <DocumentHead />
      </head>
      <body>
        <div lang={lang} dir={dir} className="min-h-dvh antialiased">
          <NextIntlClientProvider messages={messages}>
            <Providers lang={lang} dir={dir}>
              <ShortcutsProvider>
                <AppShell>{children}</AppShell>
              </ShortcutsProvider>
              <NavigationGuard />
              <ChunkLoadRecovery />
              <ServiceWorkerRegister />
            </Providers>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
