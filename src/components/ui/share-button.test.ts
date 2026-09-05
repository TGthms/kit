// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./share-button";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "copied" ? "Copied" : key === "share" ? "Share" : "Error"),
}));

vi.mock("@/lib/notify", () => ({
  notifyError: vi.fn(),
}));

describe("ShareButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses the Web Share API when present", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });

    render(
      createElement(ShareButton, {
        title: "PDF merge",
        text: "Combine files locally",
        url: "https://trykit.pages.dev/en/tools/pdf-merge/",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: "PDF merge",
        text: "Combine files locally",
        url: "https://trykit.pages.dev/en/tools/pdf-merge/",
      });
    });
  });

  it("copies the URL when Web Share is missing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText }, share: undefined });

    render(
      createElement(ShareButton, {
        title: "PDF merge",
        text: "Combine files locally",
        url: "https://trykit.pages.dev/en/tools/pdf-merge/",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://trykit.pages.dev/en/tools/pdf-merge/");
      expect(screen.getByRole("button")).toHaveAccessibleName("Copied");
    });
  });
});
