// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ActionBar } from "./shared";
import { ShortcutsProvider, SHORTCUT_RUN_EVENT } from "@/components/layout/shortcuts-provider";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
afterEach(() => { cleanup(); document.body.innerHTML = ""; });
it("does not run tools behind custom dialogs or during composition", () => {
  const run = vi.fn(); render(<ActionBar onRun={run} loading={false} label="Run" />);
  const dialog = document.createElement("div"); dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); document.body.append(dialog);
  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
  window.dispatchEvent(new Event(SHORTCUT_RUN_EVENT));
  expect(run).not.toHaveBeenCalled();
  dialog.remove();
  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true, isComposing: true });
  expect(run).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
  expect(run).toHaveBeenCalledOnce();
});


it("still toggles shortcut help with its own key while protecting the tool underneath", () => {
  const run = vi.fn();
  render(<ShortcutsProvider><ActionBar onRun={run} loading={false} label="Run" /></ShortcutsProvider>);
  fireEvent.keyDown(window, { key: "?" });
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
  expect(run).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: "?" });
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});
