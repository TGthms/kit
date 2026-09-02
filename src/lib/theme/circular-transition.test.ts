// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { applyDomTheme, resolveWipeOrigin, THEME_COLOR } from "./circular-transition";

describe("resolveWipeOrigin", () => {
  const viewport = { width: 400, height: 200 };

  it("defaults to the viewport center", () => {
    expect(resolveWipeOrigin(undefined, viewport)).toEqual({ x: 200, y: 100 });
    expect(resolveWipeOrigin("center", viewport)).toEqual({ x: 200, y: 100 });
  });

  it("maps corner presets", () => {
    expect(resolveWipeOrigin("top-left", viewport)).toEqual({ x: 0, y: 0 });
    expect(resolveWipeOrigin("top-right", viewport)).toEqual({ x: 400, y: 0 });
    expect(resolveWipeOrigin("bottom-left", viewport)).toEqual({ x: 0, y: 200 });
    expect(resolveWipeOrigin("bottom-right", viewport)).toEqual({ x: 400, y: 200 });
  });

  it("uses pointer coordinates, and the control center for keyboard clicks", () => {
    expect(resolveWipeOrigin({ clientX: 12, clientY: 34 }, viewport)).toEqual({ x: 12, y: 34 });
    const currentTarget = {
      getBoundingClientRect: () => ({ left: 40, top: 10, width: 20, height: 10 }) as DOMRect,
    } as unknown as EventTarget;
    expect(
      resolveWipeOrigin({ clientX: 0, clientY: 0, detail: 0, currentTarget }, viewport)
    ).toEqual({ x: 50, y: 15 });
  });
});

describe("applyDomTheme", () => {
  it("toggles the dark class, color-scheme, and theme-color", () => {
    document.documentElement.classList.remove("dark");
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);

    applyDomTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(meta.getAttribute("content")).toBe(THEME_COLOR.dark);

    applyDomTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(meta.getAttribute("content")).toBe(THEME_COLOR.light);
  });
});
