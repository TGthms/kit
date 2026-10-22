// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("./shared", () => ({ ToolShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
import { NumberBase } from "./number-base";
afterEach(cleanup);

it("keeps labeled base fields usable after entering an invalid fractional base", () => {
  render(<NumberBase />);
  expect(screen.getByLabelText("value")).toHaveValue("255");
  fireEvent.change(screen.getByLabelText("from"), { target: { value: "2.5" } });
  expect(screen.getByText(/Base must be an integer/)).toBeVisible();
  fireEvent.change(screen.getByLabelText("from"), { target: { value: "10" } });
  expect(screen.getByText("ff")).toBeVisible();
});

it("every tool's input/select/textarea has an explicit name or an associated Field", () => {
  const missing: string[] = [];
  const root = "src/components/tools";
  for (const file of readdirSync(root).filter((file) => file.endsWith(".tsx") && !file.includes(".test."))) {
    const source = ts.createSourceFile(file, readFileSync(`${root}/${file}`, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    expect((source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics, file).toEqual([]);
    const visit = (node: ts.Node) => {
      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        if (["Input", "Textarea", "select"].includes(node.tagName.getText(source))) {
          const attributes = node.attributes.properties.map((attr) => ts.isJsxAttribute(attr) ? attr.name.getText(source) : "");
          let parent = node.parent;
          while (parent && !(ts.isJsxElement(parent) && parent.openingElement.tagName.getText(source) === "Field")) parent = parent.parent;
          if (!parent && !attributes.some((key) => ["id", "aria-label", "aria-labelledby"].includes(key))) missing.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  expect(missing).toEqual([]);
});
