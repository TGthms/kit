"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("settings");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={title} backHref="/settings" backLabel={t("title")} sticky />
      {children}
    </div>
  );
}
