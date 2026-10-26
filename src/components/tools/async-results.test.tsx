// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { HashGenerator } from "./hash-generator";
import { QrCodeTool } from "./qr-code";
const hash = vi.hoisted(() => vi.fn());
const qr = vi.hoisted(() => vi.fn());
vi.mock("@/lib/text/hash", () => ({ HASH_ALGOS: ["SHA-256", "SHA-512"], hashText: hash, hashBytes: hash }));
vi.mock("@/lib/text/qr", () => ({ generateQrDataUrl: qr, readQrImage: qr }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("./shared", () => ({ ToolShell: ({ children }: { children: ReactNode }) => <div>{children}</div>, useToolHistory: () => vi.fn() }));
vi.mock("@/components/shared/file-dropzone", () => ({ FileDropzone: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => { cleanup(); hash.mockReset(); qr.mockReset(); });
it("ignores a hash result from an input that has since changed", async () => {
  let finish!: (text: string) => void;
  hash.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  render(<HashGenerator />);
  fireEvent.click(screen.getByRole("button", { name: "run" }));
  fireEvent.change(screen.getByLabelText("input"), { target: { value: "new source" } });
  await act(async () => finish("obsolete-hash"));
  expect(screen.queryByDisplayValue("obsolete-hash")).not.toBeInTheDocument();
  hash.mockResolvedValueOnce("current-hash");
  fireEvent.click(screen.getByRole("button", { name: "run" }));
  await waitFor(() => expect(screen.getByDisplayValue("current-hash")).toBeVisible());
  fireEvent.change(screen.getByLabelText("algo"), { target: { value: "SHA-512" } });
  expect(screen.queryByDisplayValue("current-hash")).not.toBeInTheDocument();
});
it("does not display a QR code generated for an obsolete payload", async () => {
  let finish!: (text: string) => void;
  qr.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  render(<QrCodeTool />);
  fireEvent.click(screen.getByRole("button", { name: "run" }));
  fireEvent.change(screen.getByLabelText("payload"), { target: { value: "new payload" } });
  await act(async () => finish("data:image/png;base64,old"));
  expect(document.querySelector("img")).toBeNull();
});
