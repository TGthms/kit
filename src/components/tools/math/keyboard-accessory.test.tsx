// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";
import { updateMathKeyboard } from "@/lib/math/keyboard";
import { MathKeyboardAccessory } from "./keyboard-accessory";

afterEach(() => {
  cleanup();
  updateMathKeyboard(0);
  vi.restoreAllMocks();
  delete (window as unknown as { mathVirtualKeyboard?: unknown })
    .mathVirtualKeyboard;
});

describe("math keyboard accessory", () => {
  it("remeasures the safe-area offset after layout and preserves editing focus when switching to letters", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const executeCommand = vi.fn();
    Object.defineProperty(window, "mathVirtualKeyboard", {
      configurable: true,
      value: {
        visible: true,
        boundingRect: { height: 262, top: window.innerHeight - 296 },
        layouts: ["numeric", "alphabetic"],
        normalizedLayouts: [
          { layers: [{ id: "numbers" }] },
          { layers: [{ id: "letters" }] },
        ],
        executeCommand,
      },
    });
    updateMathKeyboard(262); // SDK notification before its final positioning.
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <input aria-label="Formula" />
        <MathKeyboardAccessory />
      </NextIntlClientProvider>,
    );
    act(() => frames.shift()!(0));
    expect(document.querySelector(".math-keyboard-accessory")).toHaveStyle({
      bottom: "296px",
    });
    const input = screen.getByRole("textbox", { name: "Formula" });
    input.focus();
    const letters = screen.getByRole("button", { name: "ABC" });
    expect(fireEvent.pointerDown(letters)).toBe(false);
    fireEvent.click(letters);
    expect(input).toHaveFocus();
    expect(executeCommand).toHaveBeenCalledWith([
      "switchKeyboardLayer",
      "letters",
    ]);
  });
});
