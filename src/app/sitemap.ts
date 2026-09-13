import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { categories, tools } from "@/lib/tools/registry";
import { toolPathSegment } from "@/lib/navigation/routes";
import { absoluteUrl } from "@/lib/seo/site";
import { buildDate } from "@/lib/seo/build-date";

export const dynamic = "force-static";

/**
 * Every page a search engine should consider, in every language.
 *
 * Two things are deliberately absent. `/` is not listed: it forwards to a
 * language rather than being a page, and listing it would offer a redirecting
 * address as though it were a destination, competing with the home page it
 * forwards to. Pages that are not meant to be found, such as Settings and
 * History, are not listed either.
 *
 * `lastmod` comes from the commit rather than the build clock, so it says when
 * the content last changed instead of when the site was last deployed.
 *
 * The build step `scripts/sitemap-split.mjs` then divides this file into one
 * per language and writes an index, so a search engine reports coverage for
 * each language separately.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = buildDate();
  const dated = lastModified ? { lastModified } : {};
  const entries: MetadataRoute.Sitemap = [];
  const pages = ["", "/privacy", "/terms", "/how"];

  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: absoluteUrl(`/${locale}${page}/`),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1 : 0.5,
        ...dated,
      });
    }
    for (const category of categories) {
      entries.push({
        url: absoluteUrl(`/${locale}/c/${category}/`),
        changeFrequency: "weekly",
        priority: 0.9,
        ...dated,
      });
    }
    for (const tool of tools) {
      entries.push({
        url: absoluteUrl(`/${locale}/tools/${toolPathSegment(tool.id)}/`),
        changeFrequency: "monthly",
        priority: 0.8,
        ...dated,
      });
    }
  }
  return entries;
}
