import { describe, expect, it } from "vitest";
import { jobRatio, throwIfAborted } from "./abort";
import { forEachJobIndex, runSequentialBatch, stemmedName } from "./batch";

describe("throwIfAborted", () => {
  it("throws AbortError only after the signal fires", () => {
    const ac = new AbortController();
    expect(() => throwIfAborted(ac.signal)).not.toThrow();
    ac.abort();
    expect(() => throwIfAborted(ac.signal)).toThrowError(DOMException);
    try {
      throwIfAborted(ac.signal);
    } catch (e) {
      expect(e).toBeInstanceOf(DOMException);
      expect((e as DOMException).name).toBe("AbortError");
    }
  });
});

describe("runSequentialBatch", () => {
  it("maps every item and reports progress", async () => {
    const ratios: number[] = [];
    const out = await runSequentialBatch(
      ["a.pdf", "b.pdf"],
      async (name) => ({ blob: new Blob([name]), name: stemmedName(name, "-out", "pdf") }),
      { onProgress: (r) => ratios.push(r) }
    );
    expect(out.map((x) => x.name)).toEqual(["a-out.pdf", "b-out.pdf"]);
    expect(await out[0].blob.text()).toBe("a.pdf");
    expect(ratios).toEqual([0.5, 1]);
  });

  it("stops on abort and does not call the remaining workers", async () => {
    const ac = new AbortController();
    const seen: string[] = [];
    const run = runSequentialBatch(["one", "two", "three"], async (name) => {
      seen.push(name);
      if (name === "one") ac.abort();
      return { blob: new Blob([name]), name };
    }, { signal: ac.signal });
    await expect(run).rejects.toMatchObject({ name: "AbortError" });
    expect(seen).toEqual(["one"]);
  });
});

describe("forEachJobIndex", () => {
  it("visits every 1-based page and honors cancel between pages", async () => {
    const pages: number[] = [];
    const ac = new AbortController();
    await expect(
      forEachJobIndex(
        4,
        async (i) => {
          pages.push(i);
          if (i === 2) ac.abort();
        },
        { signal: ac.signal }
      )
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(pages).toEqual([1, 2]);
    expect(jobRatio(2, 4)).toBe(0.5);
  });
});

describe("stemmedName", () => {
  it("keeps the stem and applies the new suffix/extension", () => {
    expect(stemmedName("talk.mp4", "-converted", "webm")).toBe("talk-converted.webm");
    expect(stemmedName("notes.PDF", "-compressed", "pdf")).toBe("notes-compressed.pdf");
  });
});
