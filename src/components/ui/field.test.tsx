// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Field } from "./field";
import { Input } from "./input";
afterEach(cleanup);
it("connects the label, hint, existing descriptions and validation without replacing caller IDs", () => {
  render(<Field label="Width" description="Pixels" error="Enter a positive number"><input id="width" aria-describedby="external" /></Field>);
  const field = screen.getByLabelText("Width");
  expect(field).toHaveAttribute("id", "width");
  expect(field).toHaveAttribute("aria-describedby", "external width-description width-error");
  expect(field).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent("Enter a positive number");
});

it("points the label at the control", () => {
  render(<Field label="Hours"><Input type="number" /></Field>);
  expect(screen.getByLabelText("Hours")).toBe(screen.getByRole("spinbutton"));
});
