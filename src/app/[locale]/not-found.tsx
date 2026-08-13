import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="type-display text-3xl">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("body")}</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        {t("home")}
      </Link>
    </div>
  );
}
