// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("points the label at the control", () => {
    render(
      <Field label="Hours">
        <Input type="number" />
      </Field>
    );
    expect(screen.getByLabelText("Hours")).toBe(screen.getByRole("spinbutton"));
  });
});
