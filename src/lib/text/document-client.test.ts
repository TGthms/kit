// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { convertDocument } from "./document-client";
const terminate = vi.fn();
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("terminates a document conversion when its source is canceled", async () => {
  vi.stubGlobal("Worker", class { terminate = terminate; postMessage() {} });
  const ac = new AbortController();
  const pending = convertDocument("a: 1", "yaml", "json", true, ac.signal);
  ac.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(terminate).toHaveBeenCalledOnce();
});
it("bounds worker time and releases its resources", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("Worker", class { terminate = terminate; postMessage() {} });
  const pending = convertDocument("a: 1", "yaml", "json", true, new AbortController().signal);
  const assertion = expect(pending).rejects.toThrow("too long");
  await vi.advanceTimersByTimeAsync(8000);
  await assertion;
  expect(terminate).toHaveBeenCalledOnce();
});
