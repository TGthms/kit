// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useToolJob } from "./use-tool-job";
it("invalidates results, errors and progress from superseded jobs", () => {
  const { result, rerender, unmount } = renderHook(({ source }) => useToolJob([source]), { initialProps: { source: "first" } });
  let first!: AbortController;
  act(() => { first = result.current.start(); });
  rerender({ source: "second" });
  expect(first.signal.aborted).toBe(true);
  let second!: AbortController;
  act(() => { second = result.current.start(); result.current.report(first, 99); });
  expect(result.current.progress).toBe(0);
  act(() => { expect(result.current.complete(first, [{ blob: new Blob(), name: "old" }])).toBe(false); result.current.stop(first); });
  expect(result.current.loading).toBe(true);
  act(() => { result.current.report(second, 50); expect(result.current.fail(first, new Error("old"))).toBe(false); });
  expect(result.current.progress).toBe(50);
  expect(result.current.error).toBeNull();
  unmount();
  expect(second.signal.aborted).toBe(true);
});
it("keeps a failure visible until retry or a source change", () => {
  const { result, rerender } = renderHook(({ source }) => useToolJob([source]), { initialProps: { source: 1 } });
  act(() => { const ac = result.current.start(); result.current.fail(ac, new Error("File could not be read")); result.current.stop(ac); });
  expect(result.current.error).toBe("File could not be read");
  rerender({ source: 2 });
  expect(result.current.error).toBeNull();
});
