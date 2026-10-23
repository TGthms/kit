// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hideMathKeyboard,
  mathKeyboardHeight,
  revealMathInput,
  subscribeMathKeyboard,
  updateMathKeyboard,
} from "./keyboard";
afterEach(() => {
  updateMathKeyboard(0);
  vi.restoreAllMocks();
  document.body.replaceChildren();
});
describe("math keyboard integration", () => {
  it("publishes stable geometry and clears invalid values", () => {
    const listener = vi.fn();
    const stop = subscribeMathKeyboard(listener);
    updateMathKeyboard(240.2);
    expect(mathKeyboardHeight()).toBe(240);
    expect(listener).toHaveBeenCalledOnce();
    updateMathKeyboard(240.1);
    expect(listener).toHaveBeenCalledOnce();
    expect(document.documentElement.hasAttribute("data-math-keyboard")).toBe(
      true,
    );
    updateMathKeyboard(NaN);
    expect(mathKeyboardHeight()).toBe(0);
    expect(document.documentElement.hasAttribute("data-math-keyboard")).toBe(
      false,
    );
    stop();
  });
  it("keeps a visible field still and only scrolls when the keyboard covers it", () => {
    const field = document.createElement("math-field");
    document.body.append(field);
    vi.spyOn(field, "getBoundingClientRect").mockReturnValue({
      top: 100,
      bottom: 140,
    } as DOMRect);
    const scroll = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    revealMathInput(field);
    expect(scroll).not.toHaveBeenCalled();
    updateMathKeyboard(300);
    vi.spyOn(field, "getBoundingClientRect").mockReturnValue({
      top: 650,
      bottom: 690,
    } as DOMRect);
    revealMathInput(field);
    expect(scroll).toHaveBeenCalledOnce();
  });
  it("dismisses through the SDK and removes keyboard chrome", () => {
    const hide = vi.fn();
    Object.defineProperty(window, "mathVirtualKeyboard", {
      configurable: true,
      value: { hide },
    });
    updateMathKeyboard(250);
    hideMathKeyboard();
    expect(hide).toHaveBeenCalledWith({ animate: false });
    expect(mathKeyboardHeight()).toBe(0);
  });
});
