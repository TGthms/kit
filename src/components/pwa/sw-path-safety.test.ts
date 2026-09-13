import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const sw = readFileSync(join(here, "../../../public/sw.js"), "utf8");

const ORIGIN = "https://trykit.pages.dev";

function sliceSource(startMarker: string, endMarker: string): string {
  const start = sw.indexOf(startMarker);
  const end = sw.indexOf(endMarker);
  if (start < 0 || end < start) throw new Error(`cannot slice worker source at ${startMarker}`);
  return sw.slice(start, end);
}

/**
 * The worker is a standalone script rather than an importable module, so its
 * path helpers are extracted and run in an isolated context to check what they
 * actually return.
 */
const sandbox: Record<string, unknown> = {
  self: { location: { origin: ORIGIN } },
  URL,
};
runInNewContext(
  [
    sliceSource("function sameOriginUrl", 'self.addEventListener("install"'),
    sliceSource("function htmlPathFromTxt", "function cacheKeyFor"),
    "globalThis.__helpers = { sameOriginUrl, htmlPathFromTxt };",
  ].join("\n"),
  sandbox
);

const helpers = sandbox.__helpers as {
  sameOriginUrl: (path: string) => URL | null;
  htmlPathFromTxt: (pathname: string) => string;
};

describe("service worker path safety", () => {
  it("keeps a protocol-relative path on this origin", () => {
    const dest = helpers.sameOriginUrl(helpers.htmlPathFromTxt("//evil.tld/index.txt"));
    expect(dest).not.toBeNull();
    expect(dest?.origin).toBe(ORIGIN);
  });

  it("collapses every run of leading slashes", () => {
    for (const pathname of ["//evil.tld/", "///evil.tld/", "/////evil.tld/index.txt"]) {
      expect(helpers.htmlPathFromTxt(pathname).startsWith("//")).toBe(false);
    }
  });

  it("still maps a .txt request onto the HTML route it stands for", () => {
    expect(helpers.htmlPathFromTxt("/en/tools/base64/index.txt")).toBe("/en/tools/base64/");
    expect(helpers.htmlPathFromTxt("/en/index.txt")).toBe("/en/");
    expect(helpers.htmlPathFromTxt("/index.txt")).toBe("/");
    expect(helpers.htmlPathFromTxt("/en/")).toBe("/en/");
  });

  it("refuses any destination that resolves off-origin", () => {
    expect(helpers.sameOriginUrl("//evil.tld/")).toBeNull();
    expect(helpers.sameOriginUrl("https://evil.tld/")).toBeNull();
    expect(helpers.sameOriginUrl("http://trykit.pages.dev/")).toBeNull();
    expect(helpers.sameOriginUrl("/en/tools/base64/")).not.toBeNull();
    expect(helpers.sameOriginUrl("/en/tools/base64/")?.origin).toBe(ORIGIN);
  });

  it("stores navigations under a key without the reload marker", () => {
    expect(sw).toMatch(/function cacheKeyFor\(resource\)/);
    expect(sw).toMatch(/cache\.put\(cacheKeyFor\(resource\)/);
    expect(sw).toMatch(/url\.searchParams\.delete\("_kitcb"\)/);
  });
});
