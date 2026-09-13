import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { OBSERVANCE_KEYS } from "./greeting";

const here = dirname(fileURLToPath(import.meta.url));
const homePage = readFileSync(join(here, "../../components/home/home-page.tsx"), "utf8");
const en = JSON.parse(readFileSync(join(here, "../../../messages/en.json"), "utf8")) as {
  home: Record<string, unknown> & { greeting: { occasionLabel: Record<string, string> } };
};

describe("home occasion labels", () => {
  it("reads the label from the greeting namespace", () => {
    /* Occasion labels live under home.greeting, so a lookup built from the bare
       key misses and the greeting shows the key path instead of the label. */
    expect(homePage).not.toMatch(/`occasionLabel\./);
    expect(homePage).toMatch(/`greeting\.occasionLabel\./);
  });

  it("has a label for every observance", () => {
    for (const key of OBSERVANCE_KEYS) {
      expect(en.home.greeting.occasionLabel[key], key).toEqual(expect.any(String));
    }
  });
});
