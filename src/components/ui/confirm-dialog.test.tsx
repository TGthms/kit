// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";
import { HeroButton } from "./hero-button";
import { renderToStaticMarkup } from "react-dom/server";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({ media: query, matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function setup() {
  const confirm = vi.fn();
  render(<ConfirmDialog
    locale="en"
    trigger={<HeroButton variant="danger">Clear history</HeroButton>}
    title="Clear history"
    description="Remove saved activity from this device?"
    cancelLabel="Cancel"
    confirmLabel="Clear history"
    onConfirm={confirm}
  />);
  const trigger = screen.getByRole("button", { name: "Clear history" });
  trigger.focus();
  fireEvent.click(trigger);
  return { confirm, trigger };
}
it("names and describes the confirmation, focuses Cancel, and never clears on opening/cancel", async () => {
  const { confirm, trigger } = setup();
  const dialog = await screen.findByRole("alertdialog", { name: "Clear history" });
  await waitFor(() => expect(trigger.closest('[inert], [aria-hidden="true"]')).not.toBeNull());
  expect(dialog).toHaveAccessibleDescription("Remove saved activity from this device?");
  const cancel = within(dialog).getByRole("button", { name: "Cancel" });
  await waitFor(() => expect(cancel).toHaveFocus());
  expect(confirm).not.toHaveBeenCalled();
  fireEvent.click(cancel);
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(confirm).not.toHaveBeenCalled();
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("only runs the destructive callback after explicit confirmation", async () => {
  const { confirm } = setup();
  const dialog = await screen.findByRole("alertdialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Clear history" }));
  expect(confirm).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});
it("lets Escape cancel without invoking the destructive action", async () => {
  const { confirm } = setup();
  const dialog = await screen.findByRole("alertdialog");
  fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(confirm).not.toHaveBeenCalled();
});
it("preserves disabled button semantics and the important-action haptic marker", () => {
  const press = vi.fn();
  render(<HeroButton isDisabled onPress={press}>Disabled</HeroButton>);
  const button = screen.getByRole("button", { name: "Disabled" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("data-haptic-important");
  fireEvent.click(button);
  expect(press).not.toHaveBeenCalled();
});

it("does not promise an interactive server button before its handlers can run", () => {
  expect(renderToStaticMarkup(<HeroButton>Clear history</HeroButton>)).toMatch(/<button[^>]*disabled/);
  render(<HeroButton>Clear history</HeroButton>);
  expect(screen.getByRole("button", { name: "Clear history" })).toBeEnabled();
});
