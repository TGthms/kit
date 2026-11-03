// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { ResultFiles } from "./result-files";
const { download, archive } = vi.hoisted(() => ({
  download: vi.fn(),
  archive: vi.fn(),
}));
vi.mock("@/lib/utils", async (original) => ({
  ...(await original<typeof import("@/lib/utils")>()),
  downloadBlob: download,
  downloadMany: archive,
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  download.mockReset();
  archive.mockReset();
});
const file = {
  name: "result.pdf",
  blob: new Blob(["content"], { type: "application/pdf" }),
  originalBytes: 14,
};
const setup = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ResultFiles files={[file]} />
    </NextIntlClientProvider>,
  );
describe("file results", () => {
  it("downloads the actual output and reports size differences without requiring sharing", () => {
    setup();
    expect(screen.getByText(/14 B → 7 B/)).toHaveTextContent("-50%");
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(download).toHaveBeenCalledWith(file.blob, "result.pdf");
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });
  it("shares files in the original gesture and treats dismissal as cancellation", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("dismissed", "AbortError"));
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Share" }));
    // This assertion is synchronous: there is no await before calling share().
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0][0].files[0].name).toBe("result.pdf");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Share" })).toBeEnabled(),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    Reflect.deleteProperty(navigator, "share");
    Reflect.deleteProperty(navigator, "canShare");
  });
  it("makes a failed download recoverable", async () => {
    download.mockImplementation(() => {
      throw new Error("denied");
    });
    setup();
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Download" })),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Try again");
    expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
  });
});
