// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
const api = vi.hoisted(() => ({ getPdfMetadata: vi.fn(), setPdfMetadata: vi.fn(), getPdfPageCount: vi.fn(), organizePdf: vi.fn(), renderPdfThumbnails: vi.fn(), downloadBlob: vi.fn(), revoke: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (s: string) => s }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/pdf/core", () => api);
vi.mock("./shared", () => ({
  ToolShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useToolHistory: () => vi.fn(),
  ActionBar: ({ onRun, disabled, loading }: { onRun: () => void; disabled: boolean; loading: boolean }) => <button disabled={disabled || loading} onClick={onRun}>Run</button>,
  loadPdfjs: async () => ({ renderPdfThumbnails: api.renderPdfThumbnails }),
}));
vi.mock("@/lib/utils", async (original) => ({ ...await original<typeof import("@/lib/utils")>(), downloadBlob: api.downloadBlob }));
vi.mock("@/components/shared/file-dropzone", () => ({ FileDropzone: ({ onChange }: { onChange: (files: unknown[]) => void }) => <div>
  {[1, 2].map((n) => <button key={n} onClick={() => onChange([{ id: String(n), file: { name: `file${n}.pdf`, arrayBuffer: async () => new Uint8Array([n]).buffer } }])}>File {n}</button>)}
  <button onClick={() => onChange([])}>Remove</button>
</div> }));
import { PdfMetadata } from "./pdf-metadata";
import { PdfOrganize } from "./pdf-organize";
function deferred<T>() { let resolve!: (v: T) => void; let reject!: (e: Error) => void; const promise = new Promise<T>((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; }
const meta = (title: string) => ({ title, author: "", subject: "", keywords: "", creator: "", producer: "" });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });
async function choose(n: number) { await act(async () => fireEvent.click(screen.getByText(`File ${n}`))); }

it("does not let old metadata overwrite or get saved on the new PDF", async () => {
  const a = deferred<object>(), b = deferred<object>();
  api.getPdfMetadata.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
  api.setPdfMetadata.mockResolvedValue(new Uint8Array());
  render(<PdfMetadata />);
  await choose(1); await choose(2);
  expect(screen.getByText("Run")).toBeDisabled();
  await act(async () => b.resolve(meta("new file title")));
  await act(async () => a.resolve(meta("old file title")));
  expect(screen.getByLabelText("title")).toHaveValue("new file title");
  await act(async () => fireEvent.click(screen.getByText("Run")));
  const [bytes, saved] = api.setPdfMetadata.mock.calls[0];
  expect([...new Uint8Array(bytes)]).toEqual([2]);
  expect(saved.title).toBe("new file title");
});

it("clears readiness immediately on source replacement and ignores an old failed read", async () => {
  const a = deferred<object>(), b = deferred<object>();
  api.getPdfMetadata.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
  render(<PdfMetadata />);
  await choose(1); await choose(2);
  await act(async () => b.resolve(meta("new")));
  await act(async () => a.reject(new Error("old PDF failed")));
  expect(screen.getByLabelText("title")).toHaveValue("new");
  await act(async () => fireEvent.click(screen.getByText("Remove")));
  expect(screen.getByText("Run")).toBeDisabled();
  expect(screen.getByLabelText("title")).toHaveValue("");
});

it("ignores stale page-count results and exports every page of the current source", async () => {
  const a = deferred<number>(), b = deferred<number>();
  api.getPdfPageCount.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
  api.organizePdf.mockResolvedValue(new Uint8Array());
  render(<PdfOrganize />);
  await choose(1); await choose(2);
  expect(screen.getByText("Run")).toBeDisabled();
  await act(async () => b.resolve(40));
  await act(async () => a.resolve(30));
  await act(async () => fireEvent.click(screen.getByText("Run")));
  const [bytes, order] = api.organizePdf.mock.calls[0];
  expect([...new Uint8Array(bytes)]).toEqual([2]);
  expect(order).toEqual(Array.from({ length: 40 }, (_, i) => i));
});

it("reclaims thumbnail URLs that finish after unmount", async () => {
  const thumbnails = deferred<string[]>();
  api.getPdfPageCount.mockResolvedValue(2);
  api.renderPdfThumbnails.mockReturnValue(thumbnails.promise);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(api.revoke);
  const view = render(<PdfOrganize />);
  await choose(1); view.unmount();
  await act(async () => thumbnails.resolve(["blob:page1", "blob:page2"]));
  expect(api.revoke.mock.calls.map((c) => c[0])).toEqual(["blob:page1", "blob:page2"]);
});

it("supports page reordering with buttons and exports that order", async () => {
  api.getPdfPageCount.mockResolvedValue(2);
  api.renderPdfThumbnails.mockResolvedValue([]);
  api.organizePdf.mockResolvedValue(new Uint8Array());
  render(<PdfOrganize />); await choose(1);
  fireEvent.click(screen.getByLabelText("moveLater · page 1"));
  await act(async () => fireEvent.click(screen.getByText("Run")));
  expect(api.organizePdf.mock.calls[0][1]).toEqual([1, 0]);
});

it("does not download a completed export after its source has been removed", async () => {
  const exportJob = deferred<Uint8Array>();
  api.getPdfMetadata.mockResolvedValue(meta("current"));
  api.setPdfMetadata.mockReturnValue(exportJob.promise);
  render(<PdfMetadata />); await choose(1);
  await act(async () => fireEvent.click(screen.getByText("Run")));
  fireEvent.click(screen.getByText("Remove"));
  await act(async () => exportJob.resolve(new Uint8Array([1])));
  expect(api.downloadBlob).not.toHaveBeenCalled();
});
