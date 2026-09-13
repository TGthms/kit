import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { locales } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/seo/site";

function commitDate(): Date | null {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI"], { encoding: "utf8" }).trim();
    return iso ? new Date(iso) : null;
  } catch {
    return null;
  }
}

describe("sitemap", () => {
  const entries = sitemap();
  const paths = entries.map((entry) => new URL(entry.url).pathname);

  it("covers every language's home page", () => {
    for (const locale of locales) {
      expect(paths, locale).toContain(`/${locale}/`);
    }
  });

  it("never lists the root, which forwards to a language", () => {
    expect(paths).not.toContain("/");
    expect(entries.map((entry) => entry.url)).not.toContain(`${SITE_URL}/`);
  });

  it("never lists a page that is deliberately not meant to be found", () => {
    for (const section of ["/settings/", "/history/", "/favorites/"]) {
      expect(paths.filter((path) => path.endsWith(section))).toEqual([]);
    }
  });

  it("lists each address once, with the trailing slash the site serves", () => {
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
    const withoutSlash = paths.filter((path) => !path.endsWith("/"));
    expect(withoutSlash).toEqual([]);
  });

  it("states the commit date rather than the moment of the build", () => {
    const committed = commitDate();
    if (!committed) return; // no repository to compare against
    expect(entries.length).toBeGreaterThan(0);
    const dates = new Set(entries.map((entry) => new Date(entry.lastModified as Date).getTime()));
    expect([...dates]).toEqual([committed.getTime()]);
  });
});
