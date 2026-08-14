import type { MetadataRoute } from "next";
import { pathLocales } from "@/lib/i18n/config";
import { tools } from "@/lib/tools/registry";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/settings", "/history", "/favorites", "/privacy", "/terms"];
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of pathLocales) {
    for (const page of pages) {
      entries.push({
        url: absoluteUrl(`/${locale}${page}/`),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1 : 0.5,
      });
    }
    for (const tool of tools) {
      entries.push({
        url: absoluteUrl(`/${locale}/tools/${tool.id}/`),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }
  return entries;
}
