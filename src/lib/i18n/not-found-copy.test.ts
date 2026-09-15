import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultLocale, messageFileFor, pathLocales } from "@/lib/i18n/config";
import { notFoundCopy } from "./not-found-copy";

/*
 * The words for a page that does not exist, in every language, reached through
 * the one static document that answers for all of them. The failure this guards
 * against is quiet: a table that resolved the wrong catalog, or fell back to the
 * default language, is still a valid table — a visitor simply reads the wrong
 * language, and nothing anywhere looks broken.
 */
const here = dirname(fileURLToPath(import.meta.url));
const boot = readFileSync(join(here, "../../../public/boot/not-found.js"), "utf8");

describe("what a missing address is told in each language", () => {
  it("covers every segment an address can name", async () => {
    const copy = await notFoundCopy();
    expect(Object.keys(copy).sort()).toEqual([...pathLocales].sort());

    for (const segment of pathLocales) {
      const entry = copy[segment];
      expect(entry.title, `title for ${segment}`).toBeTruthy();
      expect(entry.body, `body for ${segment}`).toBeTruthy();
      expect(entry.home, `way back for ${segment}`).toBeTruthy();
    }
  });

  it("gives each address the wording of the language it names", async () => {
    const copy = await notFoundCopy();
    for (const segment of pathLocales) {
      const messages = (await import(`../../../messages/${messageFileFor(segment)}.json`))
        .default as { notFound: { title: string; body: string; home: string } };
      expect(copy[segment], segment).toEqual({
        title: messages.notFound.title,
        body: messages.notFound.body,
        home: messages.notFound.home,
      });
    }
  });

  it("gives a compatibility alias the same wording as the language it names", async () => {
    const copy = await notFoundCopy();
    /* `zh` is an address the site answers on and `zh-Hans` is the language;
       the table is keyed by address, so both are present and identical. */
    expect(copy.zh).toEqual(copy["zh-Hans"]);
  });

  it("leaves nothing for a translator to fill in at runtime", async () => {
    const copy = await notFoundCopy();
    for (const [segment, entry] of Object.entries(copy)) {
      for (const value of Object.values(entry)) {
        expect(value, segment).not.toMatch(/\{[a-z]/iu);
      }
    }
  });

  it("falls back to the language the document was rendered in", () => {
    /* The script answers for an address that names no language the site has by
       filling in `en`. That literal and the app's default language are the same
       decision written twice, so both are checked against each other. */
    const fallback = boot.match(/!copy\[segment\]\)\s*segment\s*=\s*"([^"]+)"/u);
    expect(fallback, "the script states no default language").toBeTruthy();
    expect(fallback![1]).toBe(defaultLocale);
  });
});
