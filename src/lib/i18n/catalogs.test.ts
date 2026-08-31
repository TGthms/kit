import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { locales, messageFileFor } from "./config";
import en from "../../../messages/en.json";
import { tools } from "@/lib/tools/registry";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      leafPaths(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return prefix ? [prefix] : [];
}

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../messages");

describe("message catalogs", () => {
  const required = leafPaths(en);

  it("ships a JSON catalog for every first-class locale", () => {
    const files = new Set(readdirSync(root));
    for (const loc of locales) {
      expect(files.has(`${loc}.json`), loc).toBe(true);
    }
  });

  it("keeps every English key in every catalog, including tool names", async () => {
    const missingByLocale: Record<string, string[]> = {};
    for (const loc of locales) {
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default;
      const missing = required.filter((path) => {
        const value = getPath(catalog, path);
        return typeof value !== "string" || value.trim() === "";
      });
      missingByLocale[loc] = missing;
    }
    const broken = Object.entries(missingByLocale).filter(([, m]) => m.length > 0);
    expect(broken.map(([loc, m]) => `${loc}:${m.length}:${m.slice(0, 5).join(",")}`)).toEqual([]);

    for (const loc of locales) {
      const file = messageFileFor(loc);
      const catalog = (await import(`../../../messages/${file}.json`)).default as {
        tools: Record<string, { name?: string; description?: string }>;
      };
      for (const tool of tools) {
        expect(catalog.tools[tool.id]?.name, `${loc} ${tool.id} name`).toBeTruthy();
        expect(catalog.tools[tool.id]?.description, `${loc} ${tool.id} description`).toBeTruthy();
      }
    }
  });

  it("keeps Chinese converter chrome keys from sliding one slot", async () => {
    for (const loc of ["zh-Hans", "zh-Hant"] as const) {
      const catalog = (await import(`../../../messages/${loc}.json`)).default as {
        tools: Record<string, Record<string, string>>;
      };
      for (const ns of ["everyday-converter", "currency-converter"]) {
        const t = catalog.tools[ns];
        expect(t.swapUnits, `${loc} ${ns} swapUnits`).not.toMatch(/货币|貨幣/u);
        expect(t.swapCurrencies, `${loc} ${ns} swapCurrencies`).toMatch(/货币|貨幣/u);
        expect(t.dpi, `${loc} ${ns} dpi`).toMatch(/DPI/i);
        expect(t.searchAria, `${loc} ${ns} searchAria`).toMatch(/\{label\}/u);
        expect(t.rateUnavailable, `${loc} ${ns} rateUnavailable`).not.toMatch(/\{label\}/u);
      }
    }
  });
});
