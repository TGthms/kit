import type { Metadata } from "next";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getTool } from "@/lib/tools/registry";
import { absoluteUrl, SITE_NAME } from "./site";

type Messages = {
  meta: { title: string; description: string };
  tools: Record<string, { name?: string; description?: string }>;
};

export async function loadMessages(locale: string): Promise<Messages> {
  const loc = isLocale(locale) ? locale : defaultLocale;
  switch (loc) {
    case "es":
      return (await import("../../../messages/es.json")).default as Messages;
    case "zh":
      return (await import("../../../messages/zh.json")).default as Messages;
    case "ja":
      return (await import("../../../messages/ja.json")).default as Messages;
    default:
      return (await import("../../../messages/en.json")).default as Messages;
  }
}

export async function buildToolMetadata(locale: string, toolId: string): Promise<Metadata> {
  const loc = (isLocale(locale) ? locale : defaultLocale) as Locale;
  const messages = await loadMessages(loc);
  const tool = getTool(toolId);
  const entry = messages.tools[tool?.id ?? toolId];
  const title = entry?.name ? `${entry.name} — ${SITE_NAME}` : messages.meta.title;
  const description = entry?.description || messages.meta.description;
  const url = absoluteUrl(`/${loc}/tools/${tool?.id ?? toolId}/`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: loc,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export async function buildLocaleMetadata(locale: string): Promise<Metadata> {
  const loc = (isLocale(locale) ? locale : defaultLocale) as Locale;
  const messages = await loadMessages(loc);
  const url = absoluteUrl(`/${loc}/`);
  return {
    title: messages.meta.title,
    description: messages.meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: messages.meta.title,
      description: messages.meta.description,
      url,
      siteName: SITE_NAME,
      locale: loc,
      type: "website",
    },
  };
}
