// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "./searchable-select";

afterEach(cleanup);

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
});
