import type { Metadata } from "next";
import { defaultLocale, isPathLocale, messageFileFor, pathLocales } from "@/lib/i18n/config";
import { getTool } from "@/lib/tools/registry";
import {
  absoluteUrl,
  ogImageUrl,
  ogLocaleFor,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_AUTHOR,
  SITE_AUTHOR_URL,
  SITE_NAME,
  SITE_URL,
} from "./site";

type Messages = {
  meta: { title: string; description: string };
  tools: Record<string, { name?: string; description?: string }>;
  settings: { title: string; subtitle: string };
  history: { title: string; subtitle: string };
  favorites: { title: string; subtitle: string };
  legal: { privacyTitle: string; termsTitle: string };
};

export async function loadMessages(locale: string): Promise<Messages> {
  const file = messageFileFor(isPathLocale(locale) ? locale : defaultLocale);
  return (await import(`../../../messages/${file}.json`)).default as Messages;
}

export function socialImages() {
  return [
    {
      url: ogImageUrl(),
      secureUrl: ogImageUrl(),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: OG_IMAGE_ALT,
      type: "image/png",
    },
  ];
}

function languageAlternates(pathAfterLocale: string): Record<string, string> {
  const map: Record<string, string> = {
    "x-default": absoluteUrl(`/en${pathAfterLocale}`),
  };
  for (const loc of pathLocales) {
    map[loc] = absoluteUrl(`/${loc}${pathAfterLocale}`);
  }
  return map;
}

function alternateOgLocales(pathLoc: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const current = ogLocaleFor(pathLoc);
  for (const loc of pathLocales) {
    const tag = ogLocaleFor(loc);
    if (tag === current || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function pageTitle(name: string): string {
  return `${name} — ${SITE_NAME}`;
}

export function buildSocialMetadata({
  pathLoc,
  title,
  description,
  pathAfterLocale,
}: {
  pathLoc: string;
  title: string;
  description: string;
  pathAfterLocale: string;
}): Metadata {
  const url = absoluteUrl(`/${pathLoc}${pathAfterLocale}`);
  const images = socialImages();
  return {
    title,
    description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_AUTHOR, url: SITE_AUTHOR_URL }],
    creator: SITE_AUTHOR,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
      languages: languageAlternates(pathAfterLocale),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: ogLocaleFor(pathLoc),
      alternateLocale: alternateOgLocales(pathLoc),
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl()],
    },
  };
}

export async function buildToolMetadata(
  locale: string,
  toolId: string,
  pathSegment = toolId === "timezone-converter" ? "world-clock" : toolId
): Promise<Metadata> {
  const pathLoc = isPathLocale(locale) ? locale : defaultLocale;
  const messages = await loadMessages(pathLoc);
  const tool = getTool(toolId);
  const entry = messages.tools[tool?.id ?? toolId];
  const title = entry?.name ? pageTitle(entry.name) : messages.meta.title;
  const description = entry?.description || messages.meta.description;
  return buildSocialMetadata({
    pathLoc,
    title,
    description,
    pathAfterLocale: `/tools/${pathSegment}/`,
  });
}

export async function buildLocaleMetadata(locale: string): Promise<Metadata> {
  const pathLoc = isPathLocale(locale) ? locale : defaultLocale;
  const messages = await loadMessages(pathLoc);
  return buildSocialMetadata({
    pathLoc,
    title: messages.meta.title,
    description: messages.meta.description,
    pathAfterLocale: "/",
  });
}

export type SectionId = "settings" | "history" | "favorites" | "privacy" | "terms";

export async function buildSectionMetadata(locale: string, section: SectionId): Promise<Metadata> {
  const pathLoc = isPathLocale(locale) ? locale : defaultLocale;
  const messages = await loadMessages(pathLoc);
  const bySection: Record<SectionId, { title: string; description: string; path: string }> = {
    settings: {
      title: pageTitle(messages.settings.title),
      description: messages.settings.subtitle,
      path: "/settings/",
    },
    history: {
      title: pageTitle(messages.history.title),
      description: messages.history.subtitle,
      path: "/history/",
    },
    favorites: {
      title: pageTitle(messages.favorites.title),
      description: messages.favorites.subtitle,
      path: "/favorites/",
    },
    privacy: {
      title: pageTitle(messages.legal.privacyTitle),
      description: messages.meta.description,
      path: "/privacy/",
    },
    terms: {
      title: pageTitle(messages.legal.termsTitle),
      description: messages.meta.description,
      path: "/terms/",
    },
  };
  const entry = bySection[section];
  return buildSocialMetadata({
    pathLoc,
    title: entry.title,
    description: entry.description,
    pathAfterLocale: entry.path,
  });
}
