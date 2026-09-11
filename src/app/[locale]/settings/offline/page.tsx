import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { buildSectionMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/layout/page-header";
import { OfflineAccess } from "@/components/settings/offline-access";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildSectionMetadata(locale, "settings");
}

export default function OfflineSettingsPage() {
  const t = useTranslations("settings");
  const tn = useTranslations("nav");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("offlineAccess")} subtitle={t("offlineAccessDesc")} backHref="/settings" backLabel={tn("settings")} />
      <OfflineAccess />
    </div>
  );
}
