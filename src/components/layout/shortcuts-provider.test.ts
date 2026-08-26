// @vitest-environment jsdom

import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SHORTCUT_RUN_EVENT, ShortcutsProvider } from "./shortcuts-provider";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("ShortcutsProvider", () => {
  it("uses app-local keys and avoids modifier collisions", () => {
    const onRun = vi.fn();
    window.addEventListener(SHORTCUT_RUN_EVENT, onRun);
    render(
      createElement(
        ShortcutsProvider,
        null,
        createElement("input", { id: "kit-search", "aria-label": "Search" })
      )
    );

    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(document.getElementById("kit-search"));

    fireEvent.keyDown(window, { key: "r" });
    expect(onRun).toHaveBeenCalledTimes(1);

    document.getElementById("kit-search")?.blur();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(document.activeElement).not.toBe(document.getElementById("kit-search"));

    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    window.removeEventListener(SHORTCUT_RUN_EVENT, onRun);
  });
});
