import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * What keeps a page's own content in the document a crawler is served.
 *
 * Next renders a page on the server only up to the nearest Suspense boundary
 * above anything that reads the router's search params: a component using that
 * hook takes its whole boundary down to the client instead. A route-level
 * `loading.tsx` already provides such a boundary, so one search-param hook
 * anywhere on a page is enough to replace that page's entire body with a
 * loading spinner — in the HTML, for every crawler that does not run
 * JavaScript. Nothing about the page looks wrong in a browser, which is how it
 * went unnoticed; these assertions are what make it visible.
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!/\.(tsx?|mts)$/u.test(name) || /\.test\./u.test(name)) return [];
    return [full];
  });
}

const files = sourceFiles(root).map((full) => ({
  path: relative(root, full),
  text: readFileSync(full, "utf8"),
}));

describe("what the server is able to render", () => {
  it("uses the search-param hook in exactly one place, inside its own boundary", () => {
    const users = files.filter((file) => /useSearchParams/u.test(file.text)).map((file) => file.path);
    /* The one place it belongs: the shell's scroll restoration, which renders
       nothing and sits in a boundary of its own with a null fallback — so
       nothing that matters is held back with it. */
    expect(users).toEqual(["components/layout/app-shell.tsx"]);

    const shell = files.find((file) => file.path === "components/layout/app-shell.tsx")!;
    const boundary = shell.text.slice(shell.text.indexOf("<Suspense"), shell.text.indexOf("</Suspense>"));
    expect(boundary).toContain("ScrollRestorationBound");
    expect(boundary).toContain("fallback={null}");
  });

  it("reads the address bar directly where a page would otherwise need the hook", () => {
    const address = files.find((file) => file.path === "lib/navigation/address.ts");
    expect(address, "lib/navigation/address.ts is missing").toBeTruthy();
    expect(address!.text).toMatch(/useSyncExternalStore/u);
    expect(address!.text).toMatch(/window\.location\.search/u);
    /* The server answer must be null, so the first client render matches. */
    expect(address!.text).toMatch(/\(\) => null/u);
    /* And the value must be re-read rather than latched, or a later navigation
       would keep answering for the page before it. */
    expect(address!.text).not.toMatch(/useRef|useState/u);
  });

  it("renders a tool page's heading and guide outside the tool's own boundary", () => {
    const route = files.find((file) => file.path === "app/[locale]/tools/[toolId]/page.tsx")!;
    const order = ["<ToolIntro", "<ToolPageClient", "<ToolGuide"].map((tag) => route.text.indexOf(tag));
    expect(order.every((at) => at > -1), "the route no longer composes heading, tool and guide").toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));

    const intro = files.find((file) => file.path === "components/tools/tool-intro.tsx")!;
    expect(intro.text).toMatch(/<PageHeader/u);
    /* The heading must not be inside the boundary that holds the tool. */
    expect(intro.text).not.toMatch(/<Suspense/u);

    /* A server component cannot be held back at all, and needs no client
       provider to find its wording. */
    const guide = files.find((file) => file.path === "components/tools/tool-guide.tsx")!;
    expect(guide.text).not.toMatch(/^"use client"/mu);
    expect(guide.text).toMatch(/from "next-intl\/server"/u);
    expect(guide.text).toMatch(/<h2/u);
  });

  it("leaves the page's single heading to the route", () => {
    const shared = files.find((file) => file.path === "components/tools/shared.tsx")!;
    const shell = shared.text.slice(shared.text.indexOf("export function ToolShell"));
    expect(shell).toMatch(/data-tool=\{toolId\}/u);
    /* Every tool renders through this shell, so a heading here would mean two
       on the page. */
    expect(shell).not.toMatch(/<h1|<PageHeader|ToolHeader/u);
  });

  it("points a related tool at a plain address, which is what a crawler follows", () => {
    const guide = files.find((file) => file.path === "components/tools/tool-guide.tsx")!;
    expect(guide.text).toMatch(/href=\{`\/tools\/\$\{toolPathSegment\(id\)\}\/`\}/u);
    expect(guide.text).not.toMatch(/toolHref\(/u);
  });
});
