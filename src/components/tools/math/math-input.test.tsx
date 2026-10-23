// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MathInput } from "./math-input";
import en from "../../../../messages/en.json";

vi.mock("mathlive", () => {
  class Mathfield extends HTMLElement {
    static locale = "en";
    static fontsDirectory = "";
    static soundsDirectory: string | null = "";
    static computeEngine: unknown;
    value = "";
    readOnly = false;
    inlineShortcuts = {};
    set locale(_value: string) {
      throw new Error("Use MathfieldElement.locale instead");
    }
    setValue(value: string) {
      this.value = value;
    }
  }
  if (!customElements.get("math-field"))
    customElements.define("math-field", Mathfield);
  return { MathfieldElement: Mathfield };
});
afterEach(cleanup);
async function editor(props: Partial<Parameters<typeof MathInput>[0]> = {}) {
  const change = vi.fn(),
    commit = vi.fn();
  const rendered = render(
    <NextIntlClientProvider locale="en" messages={en}>
      <MathInput
        value="x^2"
        label="Equation"
        onChange={change}
        onCommit={commit}
        {...props}
      />
    </NextIntlClientProvider>,
  );
  await waitFor(() =>
    expect(rendered.container.querySelector("math-field")).not.toBeNull(),
  );
  const field = rendered.container.querySelector(
    "math-field",
  )! as HTMLElement & { value: string; readOnly: boolean };
  return { field, change, commit, ...rendered };
}
describe("structured math input", () => {
  it("initializes through the supported class API and reports input", async () => {
    const { field, change } = await editor();
    expect(field.value).toBe("x^2");
    field.value = "x^3";
    fireEvent.input(field);
    expect(change).toHaveBeenCalledWith("x^3");
    const { MathfieldElement } = await import("mathlive");
    expect(MathfieldElement.fontsDirectory).toMatch(/\/vendor\/math\/fonts$/);
    expect(MathfieldElement.computeEngine).toBeNull();
    expect(MathfieldElement.soundsDirectory).toBeNull();
  });
  it("captures Enter before the editor consumes bubbling key events", async () => {
    const { field, commit } = await editor();
    field.addEventListener("keydown", (event) => event.stopPropagation());
    fireEvent.keyDown(field, { key: "Enter" });
    expect(commit).toHaveBeenCalledOnce();
  });
  it("does not replace a matching value during a normal rerender", async () => {
    const { field, rerender } = await editor();
    const setter = vi.spyOn(
      field as unknown as { setValue: (value: string) => void },
      "setValue",
    );
    await act(async () =>
      rerender(
        <NextIntlClientProvider locale="en" messages={en}>
          <MathInput value="x^2" label="Equation" />
        </NextIntlClientProvider>,
      ),
    );
    expect(setter).not.toHaveBeenCalled();
  });
  it("blocks oversized pasted expressions before the editor parses them", async () => {
    const { field, getByRole } = await editor();
    const accepted = fireEvent.paste(field, {
      clipboardData: {
        getData: (type: string) =>
          type === "text/plain" ? "1".repeat(513) : "",
      },
    });
    expect(accepted).toBe(false);
    expect(getByRole("alert").textContent).toContain("Check the expression");
  });
  it("marks output read-only and removes it from tab order", async () => {
    const { field } = await editor({ readOnly: true });
    expect(field.readOnly).toBe(true);
    expect(field.tabIndex).toBe(-1);
    expect(field.getAttribute("aria-readonly")).toBe("true");
  });
});
