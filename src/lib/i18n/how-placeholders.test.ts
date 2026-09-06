import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const messageDir = path.join(process.cwd(), "messages");
const files = fs.readdirSync(messageDir).filter((file) => file.endsWith(".json")).sort();
const en = JSON.parse(fs.readFileSync(path.join(messageDir, "en.json"), "utf8")) as {
  how: Record<string, string>;
};

function variables(value: string): string[] {
  return [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
}

describe("How Kit works interpolation", () => {
  it("keeps placeholders consistent with English in every catalog", () => {
    const expected = Object.fromEntries(
      Object.entries(en.how)
        .filter(([, value]) => variables(value).length > 0)
        .map(([key, value]) => [key, variables(value).join("|")]),
    );
    expect(Object.keys(expected).length).toBeGreaterThan(0);

    const problems: string[] = [];
    for (const file of files) {
      const locale = file.slice(0, -5);
      if (locale === "en") continue;
      const catalog = JSON.parse(fs.readFileSync(path.join(messageDir, file), "utf8")) as {
        how: Record<string, string>;
      };
      for (const [key, expectedVars] of Object.entries(expected)) {
        const value = catalog.how[key];
        // Coverage is enforced by catalogs.test; here only placeholders matter.
        if (typeof value !== "string") continue;
        if (variables(value).join("|") !== expectedVars) problems.push(`${locale}:${key}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
