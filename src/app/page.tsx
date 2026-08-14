import { LocaleGate } from "@/components/layout/locale-gate";

/**
 * Static `/` entry: pick a locale from stored preference or the browser
 * language, then replace to `/{locale}/`.
 */
export default function RootPage() {
  return <LocaleGate />;
}
