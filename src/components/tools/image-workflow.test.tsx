// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { ImageConvert } from "./image-convert";
import { stageHandoff, clearHandoff } from "@/lib/workspace/handoff";
const { convert } = vi.hoisted(() => ({ convert: vi.fn() }));
vi.mock("@/lib/image/core", () => ({ convertImage: convert }));
vi.mock("@/lib/i18n/navigation", () => ({ usePathname: () => "/tools/image-convert", useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => { cleanup(); clearHandoff(); vi.clearAllMocks(); });
function setup() {
  stageHandoff("image-convert", [new File(["pixels"], "photo.png", { type: "image/png" })]);
  return render(<NextIntlClientProvider locale="en" messages={en}><ImageConvert /></NextIntlClientProvider>);
}
describe("image workflow ownership", () => {
  it("receives a local output without selecting it again and exposes a reusable result", async () => {
    convert.mockResolvedValue(new Blob(["converted"], { type: "image/webp" }));
    setup();
    expect(screen.getByText("photo.png")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Convert" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Result" })).toBeVisible());
    expect(screen.getByText("photo.webp")).toBeVisible();
    expect(convert.mock.calls[0][0].name).toBe("photo.png");
  });
  it("cannot publish a canceled conversion after the selected source changes", async () => {
    let complete!: (blob: Blob) => void;
    convert.mockReturnValue(new Promise<Blob>((resolve) => { complete = resolve; }));
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Convert" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await act(async () => complete(new Blob(["old"], { type: "image/webp" })));
    expect(screen.queryByRole("region", { name: "Result" })).toBeNull();
    expect(screen.getByRole("button", { name: "Convert" })).toBeDisabled();
  });
});
