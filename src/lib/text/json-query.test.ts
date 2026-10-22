import { describe, expect, it } from "vitest";
import { flattenJson, jsonPathGet } from "./json-query";

describe("json query helpers", () => {
  it("flattens nested objects and arrays", () => {
    expect(flattenJson({ a: { b: 1 }, items: [{ name: "x" }, { name: "y" }] })).toEqual({
      "a.b": 1,
      "items[0].name": "x",
      "items[1].name": "y",
    });
    expect(flattenJson(42)).toEqual({ "": 42 });
  });

  it("resolves simple JSONPath expressions", () => {
    const value = { a: { b: 2 }, items: [{ name: "kit" }], "weird key": true };
    expect(jsonPathGet(value, "$.a.b")).toEqual([2]);
    expect(jsonPathGet(value, "$.items[0].name")).toEqual(["kit"]);
    expect(jsonPathGet(value, "$['weird key']")).toEqual([true]);
    expect(jsonPathGet(value, "$.missing")).toEqual([]);
  });

  it("throws on invalid paths", () => {
    expect(() => jsonPathGet({}, "a.b")).toThrow(/Invalid JSONPath/);
    expect(() => jsonPathGet({}, "$.")).toThrow(/Invalid JSONPath/);
  });
  it("preserves reserved keys, empty containers, and keys that resemble paths", () => {
    const input = JSON.parse('{"a.b":1,"a":{"b":2},"__proto__":3,"":{},"items[0]":4,"line\\nkey":5,"quote\\\"key":6}');
    const flat = flattenJson(input);
    expect(Object.keys(flat)).toHaveLength(7);
    expect(Object.getPrototypeOf(flat)).toBeNull();
    expect(flat.__proto__).toBe(3);
    for (const [key, value] of Object.entries(flat)) {
      expect(jsonPathGet(input, `$${key.startsWith("[") ? "" : "."}${key}`)).toEqual([value]);
    }
    expect(flattenJson([])).toEqual({ "": [] });
    expect(flattenJson({})).toEqual({ "": {} });
  });
});
