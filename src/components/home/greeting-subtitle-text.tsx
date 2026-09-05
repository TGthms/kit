"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { toolHref } from "@/lib/navigation/routes";
import { greetingInlineLink } from "@/lib/home/greeting-links";

const linkClassName =
  "text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground";

export function GreetingSubtitleText({
  subtitleKey,
  day,
  occasion,
}: {
  subtitleKey: string;
  day: string;
  occasion: string;
}) {
  const t = useTranslations("home");
  const link = greetingInlineLink(subtitleKey);
  const values = { day, occasion };
  if (!link) return t(subtitleKey, values);

  return t.rich(subtitleKey, {
    ...values,
    tool: (chunks: ReactNode) =>
      link.tag === "tool" ? (
        <Link href={toolHref(link.toolId)} className={linkClassName}>
          {chunks}
        </Link>
      ) : (
        chunks
      ),
    page: (chunks: ReactNode) =>
      link.tag === "page" ? (
        <Link href={link.href} className={linkClassName}>
          {chunks}
        </Link>
      ) : (
        chunks
      ),
  });
}
