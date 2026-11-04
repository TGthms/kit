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
  archiveBlob: archive,
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

it("discards a late share error when the result changes", async () => {
  let reject!: (reason: unknown) => void;
  const share = vi.fn(
    () =>
      new Promise<void>((_, fail) => {
        reject = fail;
      }),
  );
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: () => true,
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });
  const view = setup();
  fireEvent.click(await screen.findByRole("button", { name: "Share" }));
  view.rerender(
    <NextIntlClientProvider locale="en" messages={en}>
      <ResultFiles
        files={[
          {
            name: "new.pdf",
            blob: new Blob(["new"], { type: "application/pdf" }),
          },
        ]}
      />
    </NextIntlClientProvider>,
  );
  await act(async () => reject(new Error("old share failed")));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Share" })).toBeEnabled();
  Reflect.deleteProperty(navigator, "share");
  Reflect.deleteProperty(navigator, "canShare");
});

it("does not download an archive after its source result has been replaced", async () => {
  let complete!: (blob: Blob) => void;
  archive.mockReturnValue(
    new Promise<Blob>((resolve) => {
      complete = resolve;
    }),
  );
  const view = render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ResultFiles files={[file, { ...file, name: "two.pdf" }]} />
    </NextIntlClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Download" }));
  expect(archive).toHaveBeenCalledOnce();
  view.rerender(
    <NextIntlClientProvider locale="en" messages={en}>
      <ResultFiles files={[]} />
    </NextIntlClientProvider>,
  );
  await act(async () => complete(new Blob(["archive"])));
  expect(download).not.toHaveBeenCalled();
});

it("explains when the browser produces a different image format", () => {
  render(<NextIntlClientProvider locale="en" messages={en}><ResultFiles files={[{ name: "photo.png", blob: new Blob(["pixels"], { type: "image/png" }), requestedMime: "image/webp" }]} /></NextIntlClientProvider>);
  expect(screen.getByText("WebP isn’t supported by this browser. The result uses PNG.")).toBeVisible();
});
