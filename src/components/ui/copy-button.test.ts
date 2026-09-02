// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "copied" ? "Copied" : "Copy"),
}));

vi.mock("@/lib/notify", () => ({
  notifyError: vi.fn(),
}));

describe("CopyButton", () => {
  it("writes to the clipboard and swaps to Copied without a toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(createElement(CopyButton, { value: "hello" }));
    const button = screen.getByRole("button", { name: "Copy" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("hello");
      expect(button).toHaveAccessibleName("Copied");
    });
    expect(button.className).toContain("copy-btn-copied");
  });
});
