import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

/**
 * Root entry for static export.
 * With `basePath` set, next/navigation `redirect` paths are app-relative
 * (do not prefix basePath manually — Next adds it).
 */
export default function RootPage() {
  redirect(`/${defaultLocale}/`);
}
