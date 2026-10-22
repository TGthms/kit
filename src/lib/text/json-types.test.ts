import ts from "typescript";
import { describe, expect, it } from "vitest";
import { jsonToTypescript } from "./json-types";

function check(input: string, root = "Root") {
  const result = jsonToTypescript(input, root);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  const text = `${result.text}\nconst value: ${root} = ${input};\nvoid value;`;
  const file = "/kit-generated-types.ts";
  const host = ts.createCompilerHost({ strict: true, noEmit: true });
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (name, version, ...rest) => name === file ? ts.createSourceFile(file, text, version, true) : original(name, version, ...rest);
  const program = ts.createProgram([file], { strict: true, noEmit: true, skipLibCheck: true, types: [] }, host);
  const source = program.getSourceFile(file)!;
  expect(program.getSyntacticDiagnostics(source)).toEqual([]);
  expect(program.getSemanticDiagnostics(source).map((entry) => ts.flattenDiagnosticMessageText(entry.messageText, "\n"))).toEqual([]);
  return result.text;
}

describe("JSON type declarations", () => {
  it("reserves the public root name before nested fields", () => {
    check('{"root":{"value":1},"Root":{"other":true}}');
  });
  it("exports a type for root arrays, including nested arrays and null unions", () => {
    check('[{"a":1},{"b":true},null]');
    check('[[1,2],["x"]]');
    check('[]');
  });
  it("handles empty keys, non-identifiers, and sanitized-name collisions", () => {
    check('{"":{"x":1},"a-b":{"n":2},"a_b":{"ok":true},"1":{},"__proto__":null}');
    check('{"a":true}', "lowerRoot");
    expect(jsonToTypescript("true", "string")).toMatchObject({ ok: true, text: "export type _string = boolean;\n" });
  });
  it("rejects excessive nesting before recursive inference", () => {
    expect(jsonToTypescript('['.repeat(150) + '0' + ']'.repeat(150)).ok).toBe(false);
  });
});
