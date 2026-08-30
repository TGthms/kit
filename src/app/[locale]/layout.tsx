import { NextIntlClientProvider } from "next-intl";
import { Suspense } from "react";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { pathLocales, isPathLocale, localeDir, localeHtmlLang } from "@/lib/i18n/config";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { ShortcutsProvider } from "@/components/layout/shortcuts-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { NavigationGuard } from "@/components/layout/navigation-guard";
import { SiteJsonLd } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/seo/site";

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
  const messages = await getMessages();
  const lang = localeHtmlLang(locale);
  const dir = localeDir(locale);
  const meta = messages.meta as { title?: string; description?: string };

  return (
    <div lang={lang} dir={dir} className="min-h-dvh antialiased">
      <NextIntlClientProvider messages={messages}>
        <Providers lang={lang} dir={dir}>
          <ShortcutsProvider>
            <Suspense fallback={null}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </ShortcutsProvider>
          <NavigationGuard />
          <ServiceWorkerRegister />
        </Providers>
      </NextIntlClientProvider>
      <SiteJsonLd name={SITE_NAME} description={meta.description ?? ""} locale={lang} />
    </div>
  );
}
