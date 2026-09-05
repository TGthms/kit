import type { Metadata } from "next";
import { defaultLocale, isPathLocale, locales, messageFileFor } from "@/lib/i18n/config";
import { getTool, legacyToolIdMap, resolveToolId } from "@/lib/tools/registry";
import { toolPathSegment } from "@/lib/navigation/routes";
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
  categories: Record<string, string>;
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

export function languageAlternates(pathAfterLocale: string): Record<string, string> {
  const map: Record<string, string> = {
    "x-default": absoluteUrl(`/en${pathAfterLocale}`),
  };
  for (const loc of locales) {
    map[loc] = absoluteUrl(`/${loc}${pathAfterLocale}`);
  }
  return map;
}

function alternateOgLocales(pathLoc: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const current = ogLocaleFor(pathLoc);
  for (const loc of locales) {
    const tag = ogLocaleFor(loc);
    if (tag === current || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function canonicalLocale(pathLoc: string): string {
  return pathLoc === "zh" ? "zh-Hans" : pathLoc;
}

export function isIndexablePathLocale(pathLoc: string): boolean {
  return pathLoc !== "zh";
}

const NOINDEX_SECTIONS = new Set(["/settings/", "/history/", "/favorites/"]);

export function pageTitle(name: string): string {
  return `${name} — ${SITE_NAME}`;
}

export function buildSocialMetadata({
  pathLoc,
  title,
  description,
  pathAfterLocale,
  noindex = false,
}: {
  pathLoc: string;
  title: string;
  description: string;
  pathAfterLocale: string;
  noindex?: boolean;
}): Metadata {
  const canonicalLoc = canonicalLocale(pathLoc);
  const url = absoluteUrl(`/${canonicalLoc}${pathAfterLocale}`);
  const images = socialImages();
  const hide = noindex || pathLoc === "zh" || NOINDEX_SECTIONS.has(pathAfterLocale);
  return {
    title,
    description,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_AUTHOR, url: SITE_AUTHOR_URL }],
    creator: SITE_AUTHOR,
    metadataBase: new URL(SITE_URL),
    robots: hide ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: url,
      languages: languageAlternates(pathAfterLocale),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: ogLocaleFor(canonicalLoc),
      alternateLocale: alternateOgLocales(canonicalLoc),
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
  pathSegment?: string
): Promise<Metadata> {
  const pathLoc = isPathLocale(locale) ? locale : defaultLocale;
  const messages = await loadMessages(pathLoc);
  const resolved = resolveToolId(toolId) ?? getTool(toolId)?.id ?? toolId;
  const publicSegment = pathSegment ?? toolPathSegment(resolved as Parameters<typeof toolPathSegment>[0]);
  const entry = messages.tools[resolved] ?? messages.tools[toolId];
  const title = entry?.name ? pageTitle(entry.name) : messages.meta.title;
  const description = entry?.description || messages.meta.description;
  const noindex =
    toolId in legacyToolIdMap || (toolId === "timezone-converter" && pathSegment !== "world-clock");
  return buildSocialMetadata({
    pathLoc,
    title,
    description,
    pathAfterLocale: `/tools/${publicSegment}/`,
    noindex,
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

export async function toolJsonLdInput(
  locale: string,
  toolId: string,
  pathSegment?: string
): Promise<{
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
} | null> {
  const pathLoc = isPathLocale(locale) ? locale : defaultLocale;
  if (!isIndexablePathLocale(pathLoc)) return null;
  const noindex =
    toolId in legacyToolIdMap || (toolId === "timezone-converter" && pathSegment !== "world-clock");
  if (noindex) return null;
  const resolved = resolveToolId(toolId) ?? getTool(toolId)?.id ?? toolId;
  const tool = getTool(resolved);
  if (!tool) return null;
  const messages = await loadMessages(pathLoc);
  const loc = canonicalLocale(pathLoc);
  const publicSegment = pathSegment ?? toolPathSegment(resolved as Parameters<typeof toolPathSegment>[0]);
  const entry = messages.tools[resolved] ?? messages.tools[toolId];
  const name = entry?.name || resolved;
  const description = entry?.description || messages.meta.description;
  const homeUrl = absoluteUrl(`/${loc}/`);
  const categoryUrl = absoluteUrl(`/${loc}/?c=${encodeURIComponent(tool.category)}`);
  const url = absoluteUrl(`/${loc}/tools/${publicSegment}/`);
  const categoryName = messages.categories[tool.category] || tool.category;
  return {
    name,
    description,
    url,
    breadcrumbs: [
      { name: SITE_NAME, url: homeUrl },
      { name: categoryName, url: categoryUrl },
      { name, url },
    ],
  };
}

export async function legalJsonLdInput(
  locale: string,
  section: "privacy" | "terms"
): Promise<{
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
} | null> {
  const pathLoc = isPathLocale(locale) ? locale : defaultLocale;
  if (!isIndexablePathLocale(pathLoc)) return null;
  const messages = await loadMessages(pathLoc);
  const loc = canonicalLocale(pathLoc);
  const homeUrl = absoluteUrl(`/${loc}/`);
  const name = section === "privacy" ? messages.legal.privacyTitle : messages.legal.termsTitle;
  const url = absoluteUrl(`/${loc}/${section}/`);
  return {
    name,
    description: messages.meta.description,
    url,
    breadcrumbs: [
      { name: SITE_NAME, url: homeUrl },
      { name, url },
    ],
  };
}
