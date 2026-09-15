// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "./searchable-select";

const WINDOW_HEIGHT = 800;
const originalInnerHeight = window.innerHeight;

afterEach(() => {
  cleanup();
  setWindowHeight(originalInnerHeight);
});

function setWindowHeight(height: number) {
  Object.defineProperty(window, "innerHeight", { value: height, configurable: true, writable: true });
}

/**
 * Report the control as sitting at `top`..`bottom` on screen. jsdom does no
 * layout, so this is the only way to place it — and where it sits is what
 * decides which side of it the list opens on.
 */
function controlAt(combobox: HTMLElement, top: number, bottom: number) {
  const control = combobox.parentElement as HTMLElement;
  control.getBoundingClientRect = () =>
    ({
      top,
      bottom,
      height: bottom - top,
      left: 0,
      right: 320,
      width: 320,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
  return control;
}

function openAt(top: number, bottom: number, height = WINDOW_HEIGHT) {
  render(
    createElement(SearchableSelect, {
      label: "From",
      value: "usd",
      options,
      onChange: vi.fn(),
    })
  );
  const combobox = screen.getByRole("combobox", { name: "From" });
  setWindowHeight(height);
  controlAt(combobox, top, bottom);
  fireEvent.focus(combobox);
  return screen.getByRole("listbox");
}

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { label?: string }) => {
    if (key === "search") return "Search";
    if (key === "noMatches") return "No matches";
    if (key === "searchResults") return `${values?.label ?? ""} search results`;
    return key;
  },
}));

const options = [
  { value: "usd", label: "US dollar" },
  { value: "eur", label: "Euro" },
  { value: "jpy", label: "Yen" },
  { value: "gbp", label: "Pound" },
  { value: "cad", label: "Canadian dollar" },
];

describe("SearchableSelect", () => {
  it("associates the visible label with the combobox", () => {
    render(
      createElement(SearchableSelect, {
        label: "From",
        value: "usd",
        options,
        onChange: vi.fn(),
      })
    );
    expect(screen.getByRole("combobox", { name: "From" })).toBeInTheDocument();
    expect(screen.getByLabelText("From")).toBe(screen.getByRole("combobox"));
  });

  it("selects the highlighted option with Enter", () => {
    const onChange = vi.fn();
    render(
      createElement(SearchableSelect, {
        label: "From",
        value: "usd",
        options,
        onChange,
      })
    );
    const combobox = screen.getByRole("combobox", { name: "From" });
    fireEvent.focus(combobox);
    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    fireEvent.keyDown(combobox, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("eur");
  });

  it("only references the listbox while it is open", () => {
    render(
      createElement(SearchableSelect, {
        label: "From",
        value: "usd",
        options,
        onChange: vi.fn(),
      })
    );
    const combobox = screen.getByRole("combobox", { name: "From" });
    expect(combobox).not.toHaveAttribute("aria-controls");
    fireEvent.focus(combobox);
    expect(combobox).toHaveAttribute("aria-controls");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("anchors the list to its control rather than laying it into the page", () => {
    render(
      createElement(SearchableSelect, {
        label: "From",
        value: "usd",
        options,
        onChange: vi.fn(),
      })
    );
    const combobox = screen.getByRole("combobox", { name: "From" });
    fireEvent.focus(combobox);
    const listbox = screen.getByRole("listbox");
    const control = combobox.parentElement as HTMLElement;

    /* It hangs off the control's own box, out of the flow, so opening it
       cannot move the fields below it or the column beside it. */
    expect(listbox.parentElement).toBe(control);
    expect(control.className).toContain("relative");
    expect(listbox.className).toContain("absolute");
    expect(listbox.className).toContain("inset-x-0");
    // Above the page's own surfaces: the result card and the pickers themselves.
    expect(listbox.className).toMatch(/\bz-30\b/);
  });

  it("opens below the control when the window leaves room there", () => {
    const listbox = openAt(200, 240);
    expect(listbox.className).toContain("top-full");
    expect(listbox.className).not.toContain("bottom-full");
    expect(listbox.style.maxHeight).toBe("208px");
    expect(listbox.style.getPropertyValue("--popover-from")).toBe("-4px");
  });

  it("opens above the control when it sits near the foot of the window", () => {
    const listbox = openAt(720, 760);
    expect(listbox.className).toContain("bottom-full");
    expect(listbox.className).not.toContain("top-full");
    // It grows upward out of the control, so it starts below its resting place.
    expect(listbox.style.getPropertyValue("--popover-from")).toBe("4px");
  });

  it("takes only the room the window leaves it", () => {
    const listbox = openAt(200, 240, 300);
    expect(listbox.style.maxHeight).toBe("192px");
  });

  it("keeps a usable list where the window leaves hardly any room", () => {
    const listbox = openAt(60, 100, 140);
    expect(listbox.style.maxHeight).toBe("120px");
  });

  it("re-places itself when the window changes size", () => {
    const listbox = openAt(200, 240);
    expect(listbox.className).toContain("top-full");

    setWindowHeight(300);
    fireEvent(window, new Event("resize"));

    expect(listbox.className).toContain("bottom-full");
  });

  it("keeps the page where it is when the active option is scrolled into view", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      createElement(SearchableSelect, {
        label: "From",
        value: "usd",
        options: Array.from({ length: 40 }, (_, index) => ({ value: `c${index}`, label: `Currency ${index}` })),
        onChange: vi.fn(),
      })
    );
    const combobox = screen.getByRole("combobox", { name: "From" });
    fireEvent.focus(combobox);
    for (let step = 0; step < 30; step += 1) fireEvent.keyDown(combobox, { key: "ArrowDown" });

    // Walking the list must not drag the document along with it.
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
