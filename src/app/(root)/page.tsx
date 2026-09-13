import type { Metadata } from "next";
import { LocaleGate } from "@/components/layout/locale-gate";
import { defaultLocale } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Static `/` entry: pick a locale from stored preference or the browser
 * language, then replace to `/{locale}/`.
 *
 * This route sits outside `[locale]`; `(root)/layout.tsx` owns the English
 * document shell while the locale gate performs the client-side redirect.
 *
 * The address below names the default language rather than the root path.
 * Nobody arrives here to stay: the page exists to hand the visitor on to a
 * language, so presenting it as a destination of its own would leave two
 * addresses both claiming to be the English home and let a search engine pick
 * the wrong one. It is left out of the sitemap for the same reason. A visitor
 * without scripting still gets a language list, which is the `<noscript>`
 * block inside the gate.
 */
export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl(`/${defaultLocale}/`) },
  openGraph: { url: absoluteUrl(`/${defaultLocale}/`) },
};

export default function RootPage() {
  return <LocaleGate />;
}
