// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

describe("SegmentedControl", () => {
  it("moves selection with arrow keys", () => {
    const onChange = vi.fn();
    render(
      createElement(SegmentedControl, {
        value: "light",
        onChange,
        "aria-label": "Appearance",
        options: [
          { value: "system", label: "Match system" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ],
      })
    );

    const selected = screen.getByRole("radio", { name: "Light" });
    selected.focus();
    fireEvent.keyDown(selected, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("dark", expect.anything());
  });
});
