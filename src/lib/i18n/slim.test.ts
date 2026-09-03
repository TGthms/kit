import { describe, expect, it } from "vitest";
import { slimMessagesForShell } from "./slim";
import en from "../../../messages/en.json";

describe("slimMessagesForShell", () => {
  it("keeps card copy and drops tool UI plus everyday-converter", () => {
    const slim = slimMessagesForShell(en) as {
      nav: { home: string };
      tools: Record<string, Record<string, string>>;
    };
    expect(slim.nav.home).toBe(en.nav.home);
    expect(slim.tools["currency-converter"].name).toBe(en.tools["currency-converter"].name);
    expect(slim.tools["currency-converter"].description).toBe(en.tools["currency-converter"].description);
    expect(slim.tools["currency-converter"].keywords).toBe(en.tools["currency-converter"].keywords);
    expect(slim.tools["currency-converter"].limits).toBeUndefined();
    expect(slim.tools["currency-converter"].from).toBeUndefined();
    expect(slim.tools["everyday-converter"]).toBeUndefined();
    expect(Object.keys(slim.tools["pdf-merge"] ?? {})).toEqual(["name", "description", "keywords"]);
  });
});
