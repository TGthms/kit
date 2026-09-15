import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  APP_PAGE_SEGMENTS,
  BUILD_PLACEHOLDER,
  aliasLocaleDirs,
  aliasToolSegments,
  buildPrecacheManifest,
  buildStamp,
  stampServiceWorker,
} from "../../../scripts/sw-precache.mjs";

type Manifest = {
  core: string[];
  engines: string[];
  chromeByLocale: Record<string, string[]>;
  toolsByLocale: Record<string, string[]>;
  rscByLocale: Record<string, string[]>;
  extrasByLocale: Record<string, string[]>;
  pagesByLocale: Record<string, Record<string, string[]>>;
};

const INDEXABLE = '<!DOCTYPE html><html><head><title>T</title></head><body></body></html>';
const ALIAS = '<!DOCTYPE html><html><head><meta name="robots" content="noindex, follow"/></head><body></body></html>';

/** The app's own pages for one language, as a real export writes them. */
function writeAppPages(root: string, locale: string) {
  for (const [, segment] of APP_PAGE_SEGMENTS) {
    mkdirSync(join(root, locale, segment), { recursive: true });
    writeFileSync(join(root, locale, segment, "index.html"), INDEXABLE);
  }
}

describe("sw-precache manifest", () => {
  it("lists core assets, chrome for every locale, and tools only under that locale", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-precache-"));
    mkdirSync(join(root, "_next/static/chunks"), { recursive: true });
    writeFileSync(join(root, "_next/static/chunks/app.js"), "js");
    mkdirSync(join(root, "boot"), { recursive: true });
    writeFileSync(join(root, "boot/theme.js"), "js");
    mkdirSync(join(root, "vendor/ffmpeg"), { recursive: true });
    writeFileSync(join(root, "vendor/ffmpeg/ffmpeg-core.wasm.gz"), "gz");
    mkdirSync(join(root, "vendor/pdfjs"), { recursive: true });
    writeFileSync(join(root, "vendor/pdfjs/pdf.worker.min.mjs"), "mjs");
    mkdirSync(join(root, "en/tools/pdf-merge"), { recursive: true });
    mkdirSync(join(root, "en/c/pdf"), { recursive: true });
    writeFileSync(join(root, "en/tools/pdf-merge/index.html"), "<html>");
    writeFileSync(join(root, "en/c/pdf/index.html"), "<html>");
    for (const locale of ["en", "ar"]) writeAppPages(root, locale);
    mkdirSync(join(root, "404"), { recursive: true });
    writeFileSync(join(root, "404/index.html"), "<html>");
    mkdirSync(join(root, "_not-found"), { recursive: true });
    writeFileSync(join(root, "_not-found/index.html"), "<html>");

    const manifest = buildPrecacheManifest(root) as unknown as Manifest;
    expect(manifest.core).toContain("/_next/static/chunks/app.js");
    expect(manifest.core).toContain("/boot/theme.js");
    expect(manifest.engines.some((url) => url.includes("ffmpeg-core.wasm.gz"))).toBe(true);
    expect(manifest.engines.some((url) => url.includes("pdf.worker.min.mjs"))).toBe(true);
    expect(manifest.chromeByLocale.en).toContain("/en/");
    expect(manifest.chromeByLocale.en).toContain("/en/how/");
    expect(manifest.chromeByLocale.en).toContain("/en/settings/offline/");
    expect(manifest.chromeByLocale.en).toContain("/en/c/pdf/");
    expect(manifest.chromeByLocale.ar).toContain("/ar/settings/");
    expect(manifest.toolsByLocale.en).toContain("/en/tools/pdf-merge/");
    expect(manifest.rscByLocale.en).toContain("/en/index.txt");
    expect(manifest.rscByLocale.en).toContain("/en/how/index.txt");
    expect(manifest.rscByLocale.en).toContain("/en/settings/offline/index.txt");
    expect(manifest.rscByLocale.en).toContain("/en/tools/pdf-merge/index.txt");
    expect(manifest.toolsByLocale.ar ?? []).toEqual([]);
    expect(manifest.chromeByLocale["404"]).toBeUndefined();
    expect(manifest.chromeByLocale["_not-found"]).toBeUndefined();
    expect(Object.keys(manifest.chromeByLocale).sort()).toEqual(["ar", "en"]);
  });

  it("groups a language's own pages under the ids Offline access offers", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-precache-pages-"));
    try {
      writeAppPages(root, "en");
      mkdirSync(join(root, "en/c/pdf"), { recursive: true });
      mkdirSync(join(root, "en/c/text"), { recursive: true });
      writeFileSync(join(root, "en/c/pdf/index.html"), INDEXABLE);
      writeFileSync(join(root, "en/c/text/index.html"), INDEXABLE);

      const manifest = buildPrecacheManifest(root) as unknown as Manifest;
      const pages = manifest.pagesByLocale.en;
      expect(Object.keys(pages)).toEqual([...APP_PAGE_SEGMENTS.map(([id]) => id), "categories"]);
      expect(pages.home).toEqual(["/en/"]);
      expect(pages.offline).toEqual(["/en/settings/offline/"]);
      /* One row on the page, every category page behind it. */
      expect(pages.categories).toEqual(["/en/c/pdf/", "/en/c/text/"]);
      /* The map describes exactly what a language is judged complete on. */
      const flattened = Object.values(pages).flat().sort();
      expect(flattened).toEqual([...manifest.chromeByLocale.en].sort());
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("offers only the pages the export actually wrote", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-precache-partial-"));
    try {
      /* A build that wrote the home page alone must not advertise six pages
         that cannot be fetched, and must not count them against the language. */
      mkdirSync(join(root, "en"), { recursive: true });
      writeFileSync(join(root, "en/index.html"), INDEXABLE);

      const manifest = buildPrecacheManifest(root) as unknown as Manifest;
      expect(Object.keys(manifest.pagesByLocale.en)).toEqual(["home", "categories"]);
      expect(manifest.chromeByLocale.en).toEqual(["/en/"]);
      expect(manifest.rscByLocale.en).toEqual(["/en/index.txt"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("compatibility addresses", () => {
  const root = mkdtempSync(join(tmpdir(), "kit-precache-alias-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  for (const locale of ["en", "fr"]) {
    mkdirSync(join(root, locale), { recursive: true });
    writeFileSync(join(root, locale, "index.html"), INDEXABLE);
    for (const [segment, html] of [["real-tool", INDEXABLE], ["old-alias", ALIAS]] as const) {
      mkdirSync(join(root, locale, "tools", segment), { recursive: true });
      writeFileSync(join(root, locale, "tools", segment, "index.html"), html);
      writeFileSync(join(root, locale, "tools", segment, "index.txt"), "flight payload");
    }
  }

  it("is recognised from the page asking not to be indexed", () => {
    expect([...aliasToolSegments(root, ["en", "fr"])]).toEqual(["old-alias"]);
  });

  it("reads one language, since the set is the same everywhere", () => {
    const onlyFr = mkdtempSync(join(tmpdir(), "kit-precache-fr-"));
    try {
      mkdirSync(join(onlyFr, "fr/tools/old-alias"), { recursive: true });
      writeFileSync(join(onlyFr, "fr/tools/old-alias/index.html"), ALIAS);
      mkdirSync(join(onlyFr, "fr/tools/real-tool"), { recursive: true });
      writeFileSync(join(onlyFr, "fr/tools/real-tool/index.html"), INDEXABLE);
      expect([...aliasToolSegments(onlyFr, ["fr"])]).toEqual(["old-alias"]);
    } finally {
      rmSync(onlyFr, { recursive: true, force: true });
    }
  });

  it("finds none when there is no export to read", () => {
    expect(aliasToolSegments(join(root, "nope"), ["en"]).size).toBe(0);
  });

  const manifest = buildPrecacheManifest(root, "") as unknown as Manifest;

  it("are left out of the lists that decide a language is ready", () => {
    // Offline access cannot offer them, so counting them would leave every
    // language permanently incomplete.
    expect(manifest.toolsByLocale.en).toEqual(["/en/tools/real-tool/"]);
    expect(manifest.rscByLocale.en.join()).not.toContain("old-alias");
  });

  it("are prefetched all the same, page and payload", () => {
    expect(manifest.extrasByLocale.en).toEqual([
      "/en/tools/old-alias/",
      "/en/tools/old-alias/index.txt",
    ]);
  });

  it("carry the base path like every other list", () => {
    const based = buildPrecacheManifest(root, "/kit") as unknown as Manifest;
    expect(based.toolsByLocale.en).toEqual(["/kit/en/tools/real-tool/"]);
    expect(based.extrasByLocale.en[0]).toBe("/kit/en/tools/old-alias/");
  });
});

describe("a language alias", () => {
  const root = mkdtempSync(join(tmpdir(), "kit-precache-locale-alias-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  /** A home page that names its own language, as every real one does. */
  const homeNaming = (name: string) =>
    `<!DOCTYPE html><html><head><link rel="canonical" href="https://trykit.pages.dev/${name}/"/></head><body></body></html>`;

  for (const locale of ["en", "zh-Hans"]) {
    mkdirSync(join(root, locale, "tools/pdf-merge"), { recursive: true });
    writeFileSync(join(root, locale, "index.html"), homeNaming(locale));
    writeFileSync(join(root, locale, "tools/pdf-merge/index.html"), INDEXABLE);
    writeFileSync(join(root, locale, "tools/pdf-merge/index.txt"), "flight payload");
  }
  /* An old link: its address is `zh`, its content is Simplified Chinese. */
  mkdirSync(join(root, "zh", "tools/pdf-merge"), { recursive: true });
  writeFileSync(join(root, "zh", "index.html"), homeNaming("zh-Hans"));
  writeFileSync(join(root, "zh", "tools/pdf-merge/index.html"), INDEXABLE);
  writeFileSync(join(root, "zh", "tools/pdf-merge/index.txt"), "flight payload");

  const languages = ["en", "zh", "zh-Hans"];

  it("is recognised from its home page naming a different language", () => {
    expect([...aliasLocaleDirs(root, languages)]).toEqual(["zh"]);
  });

  it("is left out of the lists that decide a language is ready", () => {
    // Offline access offers the languages it can list, so a language counted
    // here but absent from that list could never be reported as ready.
    const manifest = buildPrecacheManifest(root) as unknown as Manifest;
    expect(Object.keys(manifest.chromeByLocale).sort()).toEqual(["en", "zh-Hans"]);
    expect(manifest.toolsByLocale.zh).toBeUndefined();
    expect(manifest.rscByLocale.zh).toBeUndefined();
  });

  it("is prefetched all the same, pages and payloads", () => {
    const manifest = buildPrecacheManifest(root) as unknown as Manifest;
    expect(manifest.extrasByLocale.zh).toContain("/zh/");
    expect(manifest.extrasByLocale.zh).toContain("/zh/index.txt");
    expect(manifest.extrasByLocale.zh).toContain("/zh/tools/pdf-merge/");
    expect(manifest.extrasByLocale.zh).toContain("/zh/tools/pdf-merge/index.txt");
  });

  it("leaves a language that names itself counted as usual", () => {
    const manifest = buildPrecacheManifest(root) as unknown as Manifest;
    expect(manifest.chromeByLocale["zh-Hans"]).toContain("/zh-Hans/");
    expect(manifest.toolsByLocale["zh-Hans"]).toEqual(["/zh-Hans/tools/pdf-merge/"]);
    expect(manifest.extrasByLocale["zh-Hans"]).toEqual([]);
  });

  it("finds none when there is no export to read", () => {
    expect(aliasLocaleDirs(join(root, "nope"), ["en"]).size).toBe(0);
  });
});

/** A small export whose home page can be rewritten, to move its content. */
function writeExport(root: string, homeBody: string) {
  mkdirSync(join(root, "en/tools/pdf-merge"), { recursive: true });
  writeFileSync(join(root, "en/index.html"), `<!DOCTYPE html><html><body>${homeBody}</body></html>`);
  writeFileSync(join(root, "en/tools/pdf-merge/index.html"), INDEXABLE);
  writeFileSync(join(root, "en/tools/pdf-merge/index.txt"), "flight payload");
}

describe("the build stamp that names the caches", () => {
  it("moves only when the shipped content does", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-stamp-"));
    try {
      writeExport(root, "one");
      const first = buildStamp(root, buildPrecacheManifest(root));
      expect(first).toMatch(/^[a-f0-9]{12}$/u);
      /* The same content twice names the same caches, so a rebuild that changes
         nothing does not throw away what a device already holds. */
      expect(buildStamp(root, buildPrecacheManifest(root))).toBe(first);

      /* One word inside one page is enough: the bytes are what is hashed. */
      writeExport(root, "two");
      const second = buildStamp(root, buildPrecacheManifest(root));
      expect(second).not.toBe(first);

      writeExport(root, "one");
      expect(buildStamp(root, buildPrecacheManifest(root))).toBe(first);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("moves when a page or a script appears", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-stamp-add-"));
    try {
      writeExport(root, "one");
      const before = buildStamp(root, buildPrecacheManifest(root));

      mkdirSync(join(root, "en/tools/pdf-split"), { recursive: true });
      writeFileSync(join(root, "en/tools/pdf-split/index.html"), INDEXABLE);
      expect(buildStamp(root, buildPrecacheManifest(root))).not.toBe(before);

      const withTool = buildStamp(root, buildPrecacheManifest(root));
      mkdirSync(join(root, "_next/static/chunks"), { recursive: true });
      writeFileSync(join(root, "_next/static/chunks/late.js"), "js");
      expect(buildStamp(root, buildPrecacheManifest(root))).not.toBe(withTool);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("reads the file behind an address that carries the base path", () => {
    const root = mkdtempSync(join(tmpdir(), "kit-stamp-base-"));
    try {
      /* The backup host serves every address under `/kit`, while the export
         keeps them at the root: an address has to be resolved back to the file
         it names, or the content would not be read and the stamp would sit
         still while the app changed underneath it. */
      writeExport(root, "one");
      const withBase = () => buildStamp(root, buildPrecacheManifest(root, "/kit"), "/kit");
      const first = withBase();
      writeExport(root, "two");
      expect(withBase()).not.toBe(first);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("stamping the exported worker", () => {
  const workerCarrying = (build: string) =>
    `/* Kit service worker */\nconst BUILD = "${build}";\nconst CACHE = \`kit-shell-\${GENERATION}\`;\n`;

  function withExport(contents: string, run: (dir: string) => void) {
    const root = mkdtempSync(join(tmpdir(), "kit-stamp-sw-"));
    try {
      writeFileSync(join(root, "sw.js"), contents);
      run(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  it("puts the stamp where the placeholder was", () => {
    withExport(workerCarrying(BUILD_PLACEHOLDER), (dir) => {
      expect(stampServiceWorker(dir, "0123456789ab")).toBe("0123456789ab");
      const stamped = readFileSync(join(dir, "sw.js"), "utf8");
      expect(stamped).toContain('const BUILD = "0123456789ab";');
      expect(stamped).not.toContain(BUILD_PLACEHOLDER);
    });
  });

  it("can be run again over an export that already carries a stamp", () => {
    /* A resumed build, or the step run by hand, must not be an error and must
       not leave the previous build's name in place. */
    withExport(workerCarrying("aaaaaaaaaaaa"), (dir) => {
      stampServiceWorker(dir, "bbbbbbbbbbbb");
      expect(readFileSync(join(dir, "sw.js"), "utf8")).toContain('const BUILD = "bbbbbbbbbbbb";');
      stampServiceWorker(dir, "bbbbbbbbbbbb");
      expect(readFileSync(join(dir, "sw.js"), "utf8")).toContain('const BUILD = "bbbbbbbbbbbb";');
    });
  });

  it("refuses a worker that declares no build, which would share one cache forever", () => {
    withExport("const CACHE = `kit-shell-${GENERATION}`;\n", (dir) => {
      expect(() => stampServiceWorker(dir, "0123456789ab")).toThrow(/BUILD/u);
    });
  });

  it("refuses a build value it did not write", () => {
    withExport(workerCarrying("v13"), (dir) => {
      expect(() => stampServiceWorker(dir, "0123456789ab")).toThrow(/neither the placeholder nor a stamp/u);
    });
  });
});
