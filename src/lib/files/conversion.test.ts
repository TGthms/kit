import { expect, it } from "vitest";
import { conversionOutputs, detectConversionInput } from "./conversion";

it("only offers encoders matching the detected input", () => {
  expect(conversionOutputs("image", true)).toEqual(["png", "jpeg", "webp", "zip"]);
  expect(conversionOutputs("file", true)).toEqual(["zip"]);
  expect(conversionOutputs("yaml", false)).toEqual(["json"]);
  expect(conversionOutputs("json", true)).toEqual(["yaml", "csv", "zip"]);
});
it("detects file types and pasted structured text", () => {
  expect(detectConversionInput({ name: "photo.png", type: "image/png" }, "")).toBe("image");
  expect(detectConversionInput({ name: "archive.zip", type: "application/zip" }, "")).toBe("file");
  expect(detectConversionInput(undefined, 'name: Kit\nprivate: true')).toBe("yaml");
  expect(detectConversionInput(undefined, '[{"a":1}]')).toBe("json");
  expect(detectConversionInput(undefined, 'a,b\n1,2')).toBe("csv");
});
