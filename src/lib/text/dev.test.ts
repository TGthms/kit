import { describe, expect, it } from "vitest";
import { decodeJwt } from "./jwt";
import { parseTimestamp } from "./timestamp";
import { explainCron } from "./cron";
import { convertBase } from "./base";
import { decodeHtmlEntities, encodeHtmlEntities } from "./entities";
import { convertCase } from "./case";
import { generatePassword } from "./password";
import { jsonToTypescript } from "./json-types";

describe("decodeJwt", () => {
  it("decodes a three-part token without verifying the signature", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa(JSON.stringify({ sub: "kit", nbf: 1 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const r = decodeJwt(`${header}.${payload}.sig`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.signed).toBe(true);
    expect((r.payload.json as { sub: string }).sub).toBe("kit");
    expect((r.header.json as { alg: string }).alg).toBe("HS256");
  });

  it("rejects malformed input", () => {
    expect(decodeJwt("nope").ok).toBe(false);
  });
});

describe("parseTimestamp", () => {
  it("treats 10-digit values as Unix seconds", () => {
    const r = parseTimestamp("0");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.unix).toBe(0);
      expect(r.iso).toBe("1970-01-01T00:00:00.000Z");
    }
  });

  it("parses ISO strings", () => {
    const r = parseTimestamp("2020-01-02T03:04:05.000Z");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.unix).toBe(1577934245);
  });
});

describe("explainCron", () => {
  it("explains a 5-field expression", () => {
    const r = explainCron("*/15 9-17 * * 1-5");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toContain("every 15 minutes");
    expect(r.text).toMatch(/Monday|Friday/);
  });

  it("localizes month and weekday names when a locale is passed", () => {
    const r = explainCron("0 0 1 1 0", "es");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toMatch(/enero/i);
    expect(r.text).toMatch(/domingo/i);
    const en = explainCron("0 0 1 1 0");
    expect(en.ok).toBe(true);
    if (en.ok) {
      expect(en.text).toContain("January");
      expect(en.text).toContain("Sunday");
    }
  });
});

describe("convertBase", () => {
  it("converts hex to decimal and binary", () => {
    const dec = convertBase("ff", 16, 10);
    expect(dec.ok).toBe(true);
    if (dec.ok) expect(dec.value).toBe("255");
    const bin = convertBase("255", 10, 2);
    expect(bin.ok).toBe(true);
    if (bin.ok) expect(bin.value).toBe("11111111");
  });
});

describe("html entities", () => {
  it("encodes and decodes markup characters", () => {
    const enc = encodeHtmlEntities(`<a href="x">Tom & Jerry</a>`);
    expect(enc).toContain("&lt;");
    expect(enc).toContain("&amp;");
    expect(decodeHtmlEntities("&lt;b&gt;Kit&#33;&lt;/b&gt;")).toBe("<b>Kit!</b>");
    expect(decodeHtmlEntities("&#99999999;")).toBe("&#99999999;");
  });
});

describe("convertCase", () => {
  it("produces camel, snake, and kebab forms", () => {
    expect(convertCase("Hello Kit World", "camel")).toBe("helloKitWorld");
    expect(convertCase("Hello Kit World", "snake")).toBe("hello_kit_world");
    expect(convertCase("Hello Kit World", "kebab")).toBe("hello-kit-world");
    expect(convertCase("hello_kit", "pascal")).toBe("HelloKit");
  });
});

describe("generatePassword", () => {
  it("honors length and charset", () => {
    const a = generatePassword({ length: 20, symbols: false });
    expect(a).toHaveLength(20);
    expect(a).toMatch(/^[A-Za-z0-9]+$/);
    const b = generatePassword({ length: 20, symbols: false });
    expect(b).not.toBe(a);
  });
});

describe("jsonToTypescript", () => {
  it("emits an interface from a nested object", () => {
    const r = jsonToTypescript(JSON.stringify({ name: "Kit", tags: ["pdf"], n: 1 }), "Tool");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toContain("export interface Tool");
    expect(r.text).toContain("name: string");
    expect(r.text).toContain("tags: string[]");
    expect(r.text).toContain("n: number");

    const quoted = jsonToTypescript(JSON.stringify({ "first-name": "AJ" }), "Person");
    expect(quoted.ok).toBe(true);
    if (quoted.ok) expect(quoted.text).toContain('"first-name": string');
  });
});
