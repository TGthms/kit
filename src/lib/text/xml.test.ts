import { describe, expect, it } from "vitest";
import { jsonToXml, jsonToXmlText, parseXml, xmlToJson, xmlToJsonText, type XmlNode } from "./xml";

describe("parseXml", () => {
  it("parses attributes, text, and nested elements", () => {
    const node = parseXml(`<book id="7" lang='en'>Intro<page n="1">first</page></book>`);
    expect(node.name).toBe("book");
    expect(node.attributes).toEqual({ id: "7", lang: "en" });
    expect(node.children[0]).toBe("Intro");
    const page = node.children[1] as XmlNode;
    expect(page.name).toBe("page");
    expect(page.attributes).toEqual({ n: "1" });
    expect(page.children).toEqual(["first"]);
  });

  it("handles self-closing tags, comments, CDATA, and declarations", () => {
    const node = parseXml(
      `<?xml version="1.0"?><!--top comment--><root><empty/><!--inner--><raw><![CDATA[<b>&raw</b>]]></raw></root>`
    );
    expect(node.name).toBe("root");
    expect(node.children[0]).toEqual({ name: "empty", attributes: {}, children: [] });
    expect(node.children[1]).toEqual({ name: "raw", attributes: {}, children: ["<b>&raw</b>"] });
  });

  it("skips a DOCTYPE internal subset that itself contains '>'", () => {
    // Lenient parser: unknown entities are kept literal rather than dropped.
    const node = parseXml(`<!DOCTYPE r [ <!ENTITY x "a>b"> ]><r>&x;</r>`);
    expect(node.name).toBe("r");
    expect(node.children).toEqual(["&x;"]);
  });

  it("decodes named and numeric entities, and leaves invalid ones literal", () => {
    const node = parseXml(`<t a="&lt;&amp;&quot;">&gt;&#65;&#x42;&#55296;&unknown;</t>`);
    expect(node.attributes).toEqual({ a: `<&"` });
    expect(node.children).toEqual([">AB&#55296;&unknown;"]);
  });

  it("throws on malformed input", () => {
    expect(() => parseXml("")).toThrow("Empty XML");
    expect(() => parseXml(`<a><b></a>`)).toThrow(/Unexpected closing tag/);
    expect(() => parseXml(`<a>`)).toThrow(/Missing closing tag/);
    expect(() => parseXml(`</a>`)).toThrow(/Unexpected closing tag/);
  });
});

describe("xmlToJson", () => {
  it("maps a text-only element to a string", () => {
    expect(xmlToJson(`<a>hello</a>`)).toBe("hello");
  });

  it("exposes attributes as @attributes and repeats as arrays", () => {
    expect(
      xmlToJson(`<a id="1">lead<b>1</b><b>2</b><c x="9"/></a>`)
    ).toEqual({
      "@attributes": { id: "1" },
      "#text": "lead",
      b: ["1", "2"],
      c: { "@attributes": { x: "9" } },
    });
  });
});

describe("jsonToXml", () => {
  it("serializes attributes, arrays, and entity-safe text", () => {
    expect(
      jsonToXml({ "@attributes": { id: "1" }, b: ["1", "2"], t: `<&"` })
    ).toBe(
      `<root id="1">\n  <b>1</b>\n  <b>2</b>\n  <t>&lt;&amp;&quot;</t>\n</root>\n`
    );
  });

  it("round-trips xml → json → xml → json stably", () => {
    const xml = `<catalog id="3"><book>One</book><book>Two</book><meta rated="pg"/></catalog>`;
    expect(xmlToJson(jsonToXml(xmlToJson(xml)))).toEqual(xmlToJson(xml));
  });
});

describe("text wrappers", () => {
  it("xmlToJsonText reports parser errors as results, not throws", () => {
    expect(xmlToJsonText("  ")).toEqual({ ok: false, error: "Empty XML" });
    expect(xmlToJsonText(`<a><b></a>`)).toEqual({ ok: false, error: "Unexpected closing tag </a>" });
  });

  it("survives deeply nested input by degrading to an error", () => {
    // parseNode recurses per level without a depth cap; a stack overflow
    // (RangeError) must surface as ok:false, never crash the caller.
    const result = xmlToJsonText(`<a>`.repeat(20000) + `</a>`.repeat(20000));
    expect(result.ok).toBe(false);
  });

  it("jsonToXmlText reports invalid JSON", () => {
    expect(jsonToXmlText("{nope").ok).toBe(false);
  });
});
