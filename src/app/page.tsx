import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";
import { withBasePath } from "@/lib/base-path";

/** Static-export friendly entry: server redirect + meta fallback for crawlers. */
export default function RootPage() {
  redirect(withBasePath(`/${defaultLocale}/`));
}
