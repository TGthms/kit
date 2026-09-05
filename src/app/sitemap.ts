import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { categories, tools } from "@/lib/tools/registry";
import { toolPathSegment } from "@/lib/navigation/routes";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages = ["", "/privacy", "/terms", "/how"];
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${absoluteUrl("/")}`,
      changeFrequency: "weekly",
      priority: 1,
      lastModified,
    },
  ];
  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: absoluteUrl(`/${locale}${page}/`),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1 : 0.5,
        lastModified,
      });
    }
    for (const category of categories) {
      entries.push({
        url: absoluteUrl(`/${locale}/c/${category}/`),
        changeFrequency: "weekly",
        priority: 0.9,
        lastModified,
      });
    }
    for (const tool of tools) {
      entries.push({
        url: absoluteUrl(`/${locale}/tools/${toolPathSegment(tool.id)}/`),
        changeFrequency: "monthly",
        priority: 0.8,
        lastModified,
      });
    }
  }
  return entries;
}
