import { LocaleGate } from "@/components/layout/locale-gate";

/**
 * Static `/` entry: pick a locale from stored preference or the browser
 * language, then replace to `/{locale}/`.
 *
 * This route sits outside `[locale]`; `(root)/layout.tsx` owns the English
 * document shell while the locale gate performs the client-side redirect.
 */
export default function RootPage() {
  return <LocaleGate />;
}
