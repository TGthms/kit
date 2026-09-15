import { getLocale, getTranslations } from "next-intl/server";
import { NotFoundCard } from "@/components/layout/not-found-card";
import { withBasePath } from "@/lib/base-path";
import { defaultLocale, isPathLocale } from "@/lib/i18n/config";

/**
 * The same page, reached from inside a language: a route asking for something
 * it does not have.
 *
 * It is rendered in the app shell like any other page, so it contributes the
 * card and nothing else — no heading of its own, no way back of its own. The
 * address that cannot be found is told in one place, and the one a host serves
 * for a missing address (`app/not-found.tsx`) shows the same card.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const requested = await getLocale();
  const segment = isPathLocale(requested) ? requested : defaultLocale;

  return (
    <div className="py-16">
      <NotFoundCard
        title={t("title")}
        body={t("body")}
        home={t("home")}
        href={withBasePath(`/${segment}/`)}
      />
    </div>
  );
}
