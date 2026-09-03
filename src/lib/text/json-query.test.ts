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
});
