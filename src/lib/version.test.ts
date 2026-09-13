import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "./version";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, "../../package.json"), "utf8")) as { version: string };
const settingsPage = readFileSync(join(here, "../app/[locale]/settings/page.tsx"), "utf8");

describe("app version", () => {
  it("is a plain three-part release number", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("matches the version recorded in package.json", () => {
    expect(APP_VERSION).toBe(pkg.version);
  });

  it("is the only copy of the number Settings shows", () => {
    expect(settingsPage).toContain("{APP_VERSION}");
    /* A second copy typed into the page would go stale on the next release. */
    expect(settingsPage).not.toMatch(/\b\d+\.\d+\.\d+\b/);
  });
});
