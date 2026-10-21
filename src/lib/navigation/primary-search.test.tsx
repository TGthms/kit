// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePrimarySearchVisible, visiblePrimarySearch } from "./primary-search";
import { OPEN_TOOL_SEARCH_EVENT, openToolSearch } from "./search";

afterEach(() => { cleanup(); document.body.innerHTML = ""; vi.restoreAllMocks(); });
const rect = (top: number, height = 44) => ({ top, bottom: top + height, width: 300, height, left: 0, right: 300, x: 0, y: top, toJSON() {} });
function Harness({ path }: { path: string }) {
  const visible = usePrimarySearchVisible(path);
  return <output data-testid="visible">{String(visible)}</output>;
}
function primary() {
  const header = document.createElement("header");
  vi.spyOn(header, "getBoundingClientRect").mockReturnValue(rect(0, 64));
  const main = document.createElement("main");
  main.id = "kit-main";
  const field = document.createElement("input");
  field.id = "kit-search";
  const bounds = vi.spyOn(field, "getBoundingClientRect").mockReturnValue(rect(120));
  main.append(field);
  document.body.append(header, main);
  return { field, bounds };
}
describe("search presence", () => {
  it("uses the main field only when it is visible below the header", () => {
    const { field, bounds } = primary();
    expect(visiblePrimarySearch()).toBe(field);
    bounds.mockReturnValue(rect(10));
    expect(visiblePrimarySearch()).toBeNull();
    bounds.mockReturnValue(rect(2000));
    expect(visiblePrimarySearch()).toBeNull();
  });
  it("sends the shortcut to the main field or the global dropdown according to visibility", () => {
    const { field, bounds } = primary();
    const show = vi.fn();
    window.addEventListener(OPEN_TOOL_SEARCH_EVENT, show);
    try {
      openToolSearch();
      expect(field).toHaveFocus();
      expect(show).not.toHaveBeenCalled();
      bounds.mockReturnValue(rect(-100));
      field.blur();
      openToolSearch();
      expect(show).toHaveBeenCalledOnce();
      expect(field).not.toHaveFocus();
    } finally { window.removeEventListener(OPEN_TOOL_SEARCH_EVENT, show); }
  });
  it("reveals global search after scrolling past the main field and hides it on return", async () => {
    const { bounds } = primary();
    render(<Harness path="/" />);
    await waitFor(() => expect(screen.getByTestId("visible")).toHaveTextContent("true"));
    bounds.mockReturnValue(rect(-100));
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.getByTestId("visible")).toHaveTextContent("false"));
    bounds.mockReturnValue(rect(120));
    fireEvent.scroll(window);
    await waitFor(() => expect(screen.getByTestId("visible")).toHaveTextContent("true"));
  });
  it("tracks a main field that appears after a route's loading state", async () => {
    const { field } = primary();
    field.remove();
    render(<Harness path="/c/pdf/" />);
    await waitFor(() => expect(screen.getByTestId("visible")).toHaveTextContent("false"));
    document.getElementById("kit-main")?.append(field);
    await waitFor(() => expect(screen.getByTestId("visible")).toHaveTextContent("true"));
  });
});
