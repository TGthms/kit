import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { standaloneEntry, prepareStartupEntry, entryHeaders } from "../../../scripts/startup-entry.mjs";
import { buildStamp } from "../../../scripts/sw-precache.mjs";

const markup = `<!DOCTYPE html><html><head><meta name="theme-color" content="#000"><link rel="canonical" href="https://trykit.pages.dev/en/"/><link href="/_next/static/style.css" rel="stylesheet"/><link rel="preload" as="script" href="/_next/static/runtime.js"/><script src="/_next/static/app.js" async=""></script><script id="kit-document-boot">theme()</script></head><body><style id="kit-entry-style">.kit-entry{display:flex}</style><div class="kit-entry"><h1>Kit</h1><noscript><a href="/en/">English</a></noscript></div><script id="kit-locale-entry">start()</script><script>self.__next_f.push([1,"payload"])</script><script type="application/ld+json">{"@type":"WebSite"}</script></body></html>`;

describe("standalone installed entry", () => {
  it("keeps the actual root content, metadata, and two boot scripts without framework dependencies", () => {
    const result = standaloneEntry(markup);
    expect(result).not.toContain("/_next/");
    expect(result).not.toContain("__next_f");
    for (const content of ["kit-entry-style", "kit-locale-entry", "kit-document-boot", "<h1>Kit</h1>", "<noscript>", 'rel="canonical"', 'name="theme-color"', 'application/ld+json']) expect(result).toContain(content);
    expect(standaloneEntry(result)).toBe(result);
  });
  it("fails the build rather than removing scripts from an entry that cannot boot independently", () => {
    expect(() => standaloneEntry("<html><body>Kit</body></html>")).toThrow("missing");
  });
  it("preserves global security headers without applying another path's headers", () => {
    expect(entryHeaders("/*\n  X-Frame-Options: DENY\n  Content-Security-Policy: default-src 'self'; frame-ancestors 'none'\n/vendor/*\n  Cache-Control: immutable\n")).toEqual({
      "X-Frame-Options": "DENY", "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'",
    });
  });
  it("embeds exactly the standalone root, including literal dollar signs, with stable build stamps", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-entry-"));
    try {
      writeFileSync(join(root, "index.html"), markup.replace("start()", 'start("$&")'));
      writeFileSync(join(root, "sw.js"), 'const BUILD = "__KIT_BUILD__";\nconst ENTRY_HTML = "__KIT_ENTRY_HTML__";\nconst ENTRY_HEADERS = null;\n');
      writeFileSync(join(root, "_headers"), "/*\n  X-Frame-Options: DENY\n");
      prepareStartupEntry(root);
      const entry = readFileSync(join(root, "index.html"), "utf8");
      const worker = readFileSync(join(root, "sw.js"), "utf8");
      expect(worker).toContain(`const ENTRY_HTML = ${JSON.stringify(entry)};`);
      expect(worker).toContain('const ENTRY_HEADERS = {"X-Frame-Options":"DENY"};');
      const manifest = { core: ["/"], engines: [], chromeByLocale: {}, toolsByLocale: {}, rscByLocale: {}, extrasByLocale: {} };
      const first = buildStamp(root, manifest);
      prepareStartupEntry(root);
      expect(buildStamp(root, manifest)).toBe(first);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
