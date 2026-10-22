// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { Blob as NodeBlob } from "node:buffer";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import JSZip from "jszip";
const output = vi.hoisted(() => ({ download: vi.fn(), image: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("./shared", () => ({
  ToolShell: ({ children }: { children: ReactNode }) => <div>{children}</div>, useToolHistory: () => vi.fn(),
  ActionBar: ({ onRun, disabled, loading }: { onRun: () => void; disabled: boolean; loading: boolean }) => <button disabled={disabled || loading} onClick={onRun}>Run</button>,
}));
vi.mock("@/lib/utils", async (original) => ({ ...await original<typeof import("@/lib/utils")>(), downloadBlob: output.download }));
vi.mock("@/lib/image/core", () => ({ convertImage: output.image }));
vi.mock("@/components/shared/file-dropzone", () => ({ FileDropzone: ({ onChange }: { onChange: (files: unknown[]) => void }) => <>
  <button onClick={() => onChange(["first", "second"].map((text) => ({ id: text, file: Object.assign(new NodeBlob([text]), { name: "report.txt" }) })))}>Reports</button>
  <button onClick={() => onChange([{ id: "image", file: Object.assign(new NodeBlob(["png"], { type: "image/png" }), { name: "photo.png" }) }])}>Image</button>
</> }));
import { ConvertHub } from "./convert-tools";
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

it("exports both same-name inputs with their original contents", async () => {
  vi.stubGlobal("Blob", NodeBlob);
  render(<ConvertHub />);
  fireEvent.click(screen.getByText("Reports"));
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["ZIP"]);
  await act(async () => fireEvent.click(screen.getByText("Run")));
  await waitFor(() => expect(output.download).toHaveBeenCalledOnce());
  const [blob, name] = output.download.mock.calls[0];
  expect(name).toBe("archive.zip");
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  expect(await zip.file("report.txt")!.async("string")).toBe("first");
  expect(await zip.file("report (2).txt")!.async("string")).toBe("second");
});

it("never offers JSON for images and derives the saved extension from the actual encoder result", async () => {
  output.image.mockResolvedValue(new NodeBlob(["png-result"], { type: "image/png" }));
  render(<ConvertHub />);
  fireEvent.click(screen.getByText("Image"));
  expect(screen.queryByRole("option", { name: "JSON" })).toBeNull();
  fireEvent.change(screen.getByLabelText("chooseOutput"), { target: { value: "webp" } });
  await act(async () => fireEvent.click(screen.getByText("Run")));
  expect(output.image.mock.calls[0][1]).toBe("image/webp");
  expect(output.download.mock.calls[0][1]).toBe("converted.png");
});
