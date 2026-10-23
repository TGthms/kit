// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("scrollBy", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
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
  // DOM insertion alone does not imply custom-element configuration finished.
  await waitFor(() => {
    expect(field.value).toBe("x^2");
    expect(field.readOnly).toBe(props.readOnly ?? false);
  });
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
  it("handles the virtual Return input as a commit without committing on blur", async () => {
    const { field, commit } = await editor();
    const event = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertLineBreak",
    });
    expect(fireEvent(field, event)).toBe(false);
    expect(commit).toHaveBeenCalledOnce();
    fireEvent.change(field);
    fireEvent.blur(field);
    expect(commit).toHaveBeenCalledOnce();
  });
  it("focuses a newly added editor before returning from virtual Return", async () => {
    await editor(); // Warm the same locally loaded SDK used by the first row.
    cleanup();
    function Rows() {
      const [next, setNext] = useState(false);
      return (
        <NextIntlClientProvider locale="en" messages={en}>
          <MathInput
            id="first-row"
            label="f(x)"
            value="x"
            onCommit={() => setNext(true)}
          />
          {next && <MathInput id="next-row" label="g(x)" value="" autoFocus />}
        </NextIntlClientProvider>
      );
    }
    render(<Rows />);
    act(() => {
      document.getElementById("first-row")!.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertLineBreak",
        }),
      );
      expect(document.activeElement?.id).toBe("next-row");
    });
  });
  it("uses compact fields without duplicating the guide and hints", async () => {
    const { queryByText, field } = await editor({ compact: true });
    expect(queryByText(en.math.inputHint)).toBeNull();
    expect(field.getAttribute("aria-describedby")).toBeNull();
  });
  it("shows the touch keyboard immediately and leaves the SDK delay disabled", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const show = vi.fn(),
      hide = vi.fn();
    Object.defineProperty(window, "mathVirtualKeyboard", {
      configurable: true,
      value: {
        show,
        hide,
        visible: true,
        boundingRect: { height: 240 },
        addEventListener() {},
      },
    });
    const { field } = await editor();
    fireEvent.focus(field);
    expect(show).toHaveBeenCalledWith({ animate: false });
    expect(
      (field as unknown as { mathVirtualKeyboardPolicy: string })
        .mathVirtualKeyboardPolicy,
    ).toBe("manual");
    expect(
      document.documentElement.style.getPropertyValue(
        "--kit-math-keyboard-height",
      ),
    ).toBe("240px");
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
  it("applies read-only changes before the next paint without resetting content", async () => {
    const { field, rerender } = await editor();
    const setter = vi.spyOn(
      field as unknown as { setValue: (value: string) => void },
      "setValue",
    );
    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <MathInput value="x^2" label="Equation" readOnly />
      </NextIntlClientProvider>,
    );
    expect(field.readOnly).toBe(true);
    expect(field.tabIndex).toBe(-1);
    expect(setter).not.toHaveBeenCalled();
    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <MathInput value="x^2" label="Equation" />
      </NextIntlClientProvider>,
    );
    expect(field.readOnly).toBe(false);
    expect(field.tabIndex).toBe(0);
  });
  it("marks output read-only and removes it from tab order", async () => {
    const { field } = await editor({ readOnly: true });
    expect(field.readOnly).toBe(true);
    expect(field.tabIndex).toBe(-1);
    expect(field.getAttribute("aria-readonly")).toBe("true");
  });
});
