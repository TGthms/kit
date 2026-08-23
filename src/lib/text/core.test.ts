import { describe, expect, it } from "vitest";
import { xmlToJson, jsonToXml, xmlToJsonText, jsonToXmlText } from "./xml";
import { formatSql } from "./sql";
import { hashText } from "./hash";
import { md5Hex } from "./md5";
import { generateUuid, generateUuids } from "./uuid";
import { convertColor, hslToRgb, parseHex, rgbToHex, rgbToHsl } from "./color";
import { replaceRegex, runRegex } from "./regex";
import { generateLorem } from "./lorem";
import { qrToPixels, readQrFromImageData } from "./qr";

describe("XML ↔ JSON", () => {
  it("round-trips a nested document", () => {
    const xml = `<note id="1"><to>Tim</to><items><item>A</item><item>B</item></items></note>`;
    const json = xmlToJson(xml) as {
      "@attributes": { id: string };
      to: string;
      items: { item: string[] };
    };
    expect(json["@attributes"].id).toBe("1");
    expect(json.to).toBe("Tim");
    expect(json.items.item).toEqual(["A", "B"]);
    const back = jsonToXml(json, "note");
    expect(back).toContain("<to>Tim</to>");
    expect(back).toContain("<item>A</item>");
    const parsed = xmlToJsonText(xml);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(JSON.parse(parsed.text).to).toBe("Tim");
    const asXml = jsonToXmlText(JSON.stringify({ hello: "kit" }), "root");
    expect(asXml.ok).toBe(true);
    if (asXml.ok) expect(asXml.text).toContain("<hello>kit</hello>");
  });
});

describe("SQL format", () => {
  it("uppercases keywords and breaks major clauses", () => {
    const r = formatSql("select id, name from users where id = 1 order by name");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.text).toContain("SELECT");
    expect(r.text).toContain("FROM");
    expect(r.text).toContain("WHERE");
    expect(r.text).toContain("ORDER");
    expect(r.text.split("\n").length).toBeGreaterThan(1);

    const withComments = formatSql("select id -- keep this\nfrom users /* keep that */");
    expect(withComments.ok).toBe(true);
    if (withComments.ok) {
      expect(withComments.text).toContain("-- keep this");
      expect(withComments.text).toContain("/* keep that */");
    }
  });
});

describe("hashes", () => {
  it("MD5 matches the RFC empty-string and 'abc' vectors", async () => {
    expect(md5Hex("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5Hex("abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(await hashText("abc", "MD5")).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("SHA-1 and SHA-256 match known vectors", async () => {
    expect(await hashText("abc", "SHA-1")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(await hashText("abc", "SHA-256")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });
});

describe("UUID", () => {
  it("emits version 4 and version 7 strings", () => {
    const v4 = generateUuid(4);
    expect(v4).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const v7 = generateUuid(7);
    expect(v7).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(new Set(generateUuids(5)).size).toBe(5);
  });
});

describe("color convert", () => {
  it("parses hex and converts rgb ↔ hsl", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(hsl.h).toBeCloseTo(0, 5);
    expect(hsl.s).toBeCloseTo(100, 5);
    const back = hslToRgb(hsl);
    expect(back).toEqual({ r: 255, g: 0, b: 0 });
    const all = convertColor("#336699");
    expect(all?.hex).toBe("#336699");
    expect(all?.cssRgb).toBe("rgb(51, 102, 153)");
  });
});

describe("regex tester", () => {
  it("finds groups and can replace", () => {
    const r = runRegex("(\\w+)@(\\w+)", "g", "a@b c@d");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.matches).toHaveLength(2);
    expect(r.matches[0].groups).toEqual(["a", "b"]);
    const replaced = replaceRegex("cat", "g", "cat cat", "dog");
    expect(replaced.ok).toBe(true);
    if (replaced.ok) expect(replaced.text).toBe("dog dog");
    expect(runRegex("(", "", "x").ok).toBe(false);
  });
});

describe("lorem", () => {
  it("generates the requested shape", () => {
    const words = generateLorem(4, "words").split(" ");
    expect(words).toHaveLength(4);
    const sentences = generateLorem(2, "sentences");
    expect(sentences.split(".").filter(Boolean).length).toBe(2);
    const paras = generateLorem(2, "paragraphs").split("\n\n");
    expect(paras).toHaveLength(2);
  });
});

describe("QR generate / read", () => {
  it("round-trips payload through a rendered matrix", async () => {
    const payload = "https://trykit.pages.dev/en/";
    const img = await qrToPixels(payload, 6);
    const read = readQrFromImageData(img.data, img.width, img.height);
    expect(read).toBe(payload);
  });
});
