// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { hapticMode, installHaptics, shouldHaptic } from "./haptics";

let dispose = () => {};
afterEach(() => {
  dispose();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function button(attributes = "") {
  document.body.insertAdjacentHTML("beforeend", `<button ${attributes}><span>Run</span></button>`);
  return document.body.lastElementChild as HTMLButtonElement;
}

function ios() {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone");
  Object.defineProperty(HTMLInputElement.prototype, "switch", { configurable: true, get: () => true });
  Object.defineProperty(navigator, "vibrate", { configurable: true, value: undefined });
}

afterEach(() => {
  Reflect.deleteProperty(HTMLInputElement.prototype, "switch");
  Reflect.deleteProperty(navigator, "vibrate");
});

function eventListeners() {
  const original = EventTarget.prototype.addEventListener;
  const listeners: { target: EventTarget; type: string; listener: EventListenerOrEventListenerObject }[] = [];
  vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (this: EventTarget, type, listener, options) {
    if (listener) listeners.push({ target: this, type, listener });
    original.call(this, type, listener, options);
  });
  return (target: EventTarget, type: string, event: object) => {
    for (const item of listeners.filter((item) => item.target === target && item.type === type)) {
      if (typeof item.listener === "function") item.listener.call(target, event as Event);
    }
  };
}

describe("haptic policy", () => {
  it("validates persisted modes", () => {
    expect(hapticMode("off")).toBe("off");
    expect(hapticMode("reduced")).toBe("reduced");
    expect(hapticMode({})).toBe("full");
  });
  it("reduced feedback keeps primary actions and controls, while Off silences all", () => {
    const plain = button();
    const primary = button("data-haptic-important");
    const control = button('role="switch"');
    expect(shouldHaptic(plain, "full")).toBe(true);
    expect(shouldHaptic(plain, "reduced")).toBe(false);
    for (const el of [primary, control]) {
      expect(shouldHaptic(el, "reduced")).toBe(true);
      expect(shouldHaptic(el, "off")).toBe(false);
    }
  });
  it("excludes disabled, inert, hidden, disconnected, and explicitly opted-out actions", () => {
    for (const attrs of ["disabled", 'aria-disabled="true"', "inert", 'aria-hidden="true"', 'data-haptic="off"']) {
      expect(shouldHaptic(button(attrs), "full")).toBe(false);
    }
    const removed = button(); removed.remove();
    expect(shouldHaptic(removed, "full")).toBe(false);
  });
  it("vibrates once for a trusted action and ignores synthetic and modified clicks", () => {
    const fire = eventListeners();
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vibrate });
    const el = button();
    dispose = installHaptics(() => "full");
    const event = { target: el.firstElementChild, isTrusted: true, button: 0 };
    fire(document, "click", event);
    fire(document, "click", { ...event, isTrusted: false });
    fire(document, "click", { ...event, metaKey: true });
    expect(vibrate).toHaveBeenCalledExactlyOnceWith(10);
    expect(el.querySelector(".kit-ios-haptic-hit")).toBeNull();
  });
});

describe("iOS trusted-label feedback", () => {
  it("keeps the switch out of focus and accessibility and does not replace the button", () => {
    ios(); const el = button();
    dispose = installHaptics(() => "full");
    const host = el.querySelector(".kit-ios-haptic-hit")!;
    const tick = host.shadowRoot!.querySelector("input")!;
    expect(host.getAttribute("aria-hidden")).toBe("true");
    expect(tick.hidden).toBe(true);
    expect(tick.tabIndex).toBe(-1);
    expect(tick.hasAttribute("switch")).toBe(true);
    expect(el.textContent).toBe("Run");
    dispose();
    expect(el.childElementCount).toBe(1);
  });
  it("leaves the original trusted click to perform the action and stops the switch's extra click", () => {
    ios(); const fire = eventListeners(); const el = button();
    dispose = installHaptics(() => "full");
    const root = el.querySelector(".kit-ios-haptic-hit")!.shadowRoot!;
    const event = { isTrusted: true, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    const action = vi.spyOn(el, "click");
    fire(root.querySelector("label")!, "click", event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(el);
    expect(action).not.toHaveBeenCalled();
    fire(root.querySelector("input")!, "click", event);
    expect(event.stopPropagation).toHaveBeenCalledOnce();
  });
  it("cancels native feedback and action after scrolling or pointer cancellation", () => {
    ios(); const fire = eventListeners(); const el = button();
    dispose = installHaptics(() => "full");
    const label = el.querySelector(".kit-ios-haptic-hit")!.shadowRoot!.querySelector("label")!;
    for (const cancel of ["pointermove", "pointercancel"]) {
      fire(label, "pointerdown", { pointerId: 1, clientX: 0, clientY: 0, button: 0, isPrimary: true });
      fire(label, cancel, { pointerId: 1, clientX: 0, clientY: 30 });
      const event = { isTrusted: true, preventDefault: vi.fn(), stopPropagation: vi.fn() };
      fire(label, "click", event);
      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(event.stopPropagation).toHaveBeenCalledOnce();
    }
  });
  it("does not arm links, form actions, input-bearing buttons, focus-managed options, or SDK drag controls", () => {
    ios();
    document.body.innerHTML = '<a href="/en/" data-pressable>Home</a><form><button>Submit</button><button type="reset">Reset</button></form><button><input></button><button role="option">Choice</button><button role="slider">Handle</button><div class="kit-sdk-control"><button role="switch">Glass</button></div>';
    dispose = installHaptics(() => "full");
    expect(document.querySelector(".kit-ios-haptic-hit")).toBeNull();
  });
  it("handles route additions, React child replacements, removal, and final cleanup", async () => {
    ios(); dispose = installHaptics(() => "full");
    const el = button();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.querySelectorAll(".kit-ios-haptic-hit")).toHaveLength(1);
    el.innerHTML = "Updated";
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.querySelectorAll(".kit-ios-haptic-hit")).toHaveLength(1);
    el.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.querySelector(".kit-ios-haptic-hit")).toBeNull();
    dispose(); button();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector(".kit-ios-haptic-hit")).toBeNull();
  });
  it("Off installs no overlays or observers; Reduced arms only important controls", () => {
    ios(); const plain = button(); const important = button('role="switch"');
    dispose = installHaptics(() => "off");
    expect(document.querySelector(".kit-ios-haptic-hit")).toBeNull();
    dispose(); dispose = installHaptics(() => "reduced");
    expect(plain.querySelector(".kit-ios-haptic-hit")).toBeNull();
    expect(important.querySelectorAll(".kit-ios-haptic-hit")).toHaveLength(1);
  });
  it("arms a newly enabled action and disarms a control that becomes inert", async () => {
    ios(); const el = button("disabled");
    dispose = installHaptics(() => "full");
    expect(el.querySelector(".kit-ios-haptic-hit")).toBeNull();
    el.disabled = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.querySelectorAll(".kit-ios-haptic-hit")).toHaveLength(1);
    el.setAttribute("inert", "");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.querySelector(".kit-ios-haptic-hit")).toBeNull();
  });
});
