import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * The document a host serves for an address that does not exist.
 *
 * It cannot be checked by rendering a page: no route reaches it, and only a
 * build produces it. It also rests on two couplings that fail silently — the
 * ids the boot script rewrites, and the fact that nothing else gives it a
 * document shell — so the rules are pinned here, over the code rather than the
 * prose, since the prose names the same tags.
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/** A file without its comments, which describe the same tags the code uses. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");
}

const document_ = code(read("app/not-found.tsx"));
const inLanguage = code(read("app/[locale]/not-found.tsx"));
const card = code(read("components/layout/not-found-card.tsx"));
const boot = code(readFileSync(join(root, "../public/boot/not-found.js"), "utf8"));

/** The ids a piece of markup declares. */
function declaredIds(source: string): string[] {
  return [...source.matchAll(/\bid="([^"]+)"/gu)].map((match) => match[1]).sort();
}

/** The ids a script looks up. */
function addressedIds(source: string): string[] {
  return [...source.matchAll(/getElementById\("([^"]+)"\)/gu)].map((match) => match[1]).sort();
}

describe("the page a missing address is answered with", () => {
  it("brings its own document shell, because no layout here provides one", () => {
    /* The root layout is a pass-through that renders `children`, and each route
       is given <html> and <body> by the layout of its language. A missing
       address has no language, so this document is the only thing that can
       supply them — and a version of it that renders a fragment instead would
       lose the styling, the theme and the direction without any error. */
    expect(read("app/layout.tsx")).toMatch(/return children;/u);
    expect(document_).toMatch(/<html\b/u);
    expect(document_).toMatch(/<body\b/u);
    expect(document_).toMatch(/<DocumentHead\s*\/>/u);
    expect(document_).toMatch(/lang=\{localeHtmlLang\(defaultLocale\)\}/u);
  });

  it("speaks the language of the address rather than the one it was written in", () => {
    /* The document is one file for the whole site, so the wording for every
       language travels with it and the script picks by the first segment. */
    expect(document_).toMatch(/await notFoundCopy\(\)/u);
    expect(document_).toMatch(/id="kit-not-found-copy"/u);
    expect(document_).toMatch(/withAsset\("\/boot\/not-found\.js"\)/u);
    expect(boot).toMatch(/location\.pathname/u);
    expect(boot).toMatch(/copy\[segment\]/u);
  });

  it("addresses exactly the ids the page declares, and no others", () => {
    /* A rename on either side leaves the page readable but in the wrong
       language, and nothing else would notice: the swap has no error to throw
       and no type to fail. */
    const declared = [...declaredIds(card), ...declaredIds(document_)].sort();
    expect(declared).toContain("kit-not-found-copy");
    expect(addressedIds(boot)).toEqual(declared);
  });

  it("shows the same thing inside a language as it does for a missing address", () => {
    /* One page, told once: neither version carries wording of its own. */
    expect(document_).toMatch(/<NotFoundCard\b/u);
    expect(inLanguage).toMatch(/<NotFoundCard\b/u);
    expect(card).toMatch(/<h1\b/u);
    expect(card).not.toMatch(/getTranslations|useTranslations/u);
    /* And the way back is a plain link to an address rather than a client
       boundary: this page is reached when something is already wrong. */
    expect(card).toMatch(/<a\b/u);
    expect(card).not.toMatch(/"use client"/u);
    expect(document_).not.toMatch(/"use client"/u);
  });

  it("asks nothing of the network or of storage to be read", () => {
    /* A visitor arrives because a link, a bookmark or a typed address failed,
       so nothing here may depend on the app's own runtime arriving first. */
    expect(document_).not.toMatch(/<AppShell|<Suspense|useSearchParams/u);
    expect(boot).not.toMatch(/fetch\(|sessionStorage|localStorage/u);
  });
});
