import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { pathLocales, isPathLocale, localeDir, localeHtmlLang } from "@/lib/i18n/config";
import { withAsset } from "@/lib/base-path";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { ShortcutsProvider } from "@/components/layout/shortcuts-provider";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { SiteJsonLd } from "@/lib/seo/json-ld";
import { CONTENT_SECURITY_POLICY, SITE_NAME } from "@/lib/seo/site";

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
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,s=localStorage.getItem("theme")||"system",t=s==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark";}else{d.classList.remove("dark");d.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
        <link rel="icon" href={withAsset("/icons/favicon.svg")} type="image/svg+xml" />
        <link rel="icon" href={withAsset("/icons/favicon-32.png")} type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href={withAsset("/icons/apple-touch-icon.png")} sizes="180x180" />
        <meta name="theme-color" content="#0A84FF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <SiteJsonLd name={SITE_NAME} description={meta.description ?? ""} locale={lang} />
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
