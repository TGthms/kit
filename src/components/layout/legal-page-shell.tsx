"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";

export function LegalPageShell({
  title,
  children,
  backHref = "/settings",
  backLabel,
}: {
  title: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const t = useTranslations("settings");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={title} backHref={backHref} backLabel={backLabel ?? t("title")} sticky />
      {children}
    </div>
  );
}
