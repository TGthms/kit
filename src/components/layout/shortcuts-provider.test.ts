// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SHORTCUT_RUN_EVENT, ShortcutsProvider } from "./shortcuts-provider";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

afterEach(cleanup);

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

    // Ctrl/Cmd+R is the browser's reload shortcut; it must never be
    // hijacked into firing the app's Run action.
    fireEvent.keyDown(window, { key: "r", ctrlKey: true });
    expect(onRun).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: "r", metaKey: true });
    expect(onRun).toHaveBeenCalledTimes(1);

    // Native <select> elements handle their own "type to select" behavior
    // and must not be treated as global shortcut targets.
    const select = document.createElement("select");
    document.body.appendChild(select);
    select.focus();
    fireEvent.keyDown(select, { key: "r" });
    expect(onRun).toHaveBeenCalledTimes(1);
    select.remove();

    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    window.removeEventListener(SHORTCUT_RUN_EVENT, onRun);
  });

  it("moves focus into the help panel and returns it when the panel closes", () => {
    render(createElement(ShortcutsProvider, null, createElement("button", { type: "button" }, "Behind")));
    const behind = screen.getByRole("button", { name: "Behind" });
    behind.focus();
    expect(document.activeElement).toBe(behind);

    fireEvent.keyDown(window, { key: "?" });
    const dialog = screen.getByRole("dialog");
    expect(document.activeElement).toBe(dialog);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(behind);
  });

  it("keeps Tab inside the open panel", () => {
    render(createElement(ShortcutsProvider, null, createElement("button", { type: "button" }, "Behind")));
    fireEvent.keyDown(window, { key: "?" });
    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button");

    close.focus();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
