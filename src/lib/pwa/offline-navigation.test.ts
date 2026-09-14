import { describe, expect, it } from "vitest";
import { isHeldOffline, offlineProbeKeys } from "./offline-navigation";

const ORIGIN = "https://trykit.pages.dev";

describe("offlineProbeKeys", () => {
  it("asks for the page and for the payload beside it", () => {
    expect(offlineProbeKeys("/en/history/", ORIGIN)).toEqual({
      page: [`${ORIGIN}/en/history/`],
      payload: [`${ORIGIN}/en/history/index.txt`],
    });
  });

  it("adds the trailing slash a tool link leaves off", () => {
    // toolHref() builds `/tools/pdf-merge?from=…`, so the directory has to be
    // recovered before the payload beside it can be named.
    expect(offlineProbeKeys("/en/tools/pdf-merge", ORIGIN).payload).toEqual([
      `${ORIGIN}/en/tools/pdf-merge/index.txt`,
    ]);
  });

  it("keeps the query, because Next asks for the payload with it", () => {
    const keys = offlineProbeKeys("/en/tools/pdf-merge?from=%2F", ORIGIN);
    expect(keys.page).toEqual([`${ORIGIN}/en/tools/pdf-merge`, `${ORIGIN}/en/tools/pdf-merge?from=%2F`]);
    expect(keys.payload).toEqual([
      `${ORIGIN}/en/tools/pdf-merge/index.txt`,
      `${ORIGIN}/en/tools/pdf-merge/index.txt?from=%2F`,
    ]);
  });

  it("ignores the fragment", () => {
    expect(offlineProbeKeys("/en/history/#list", ORIGIN).page).toEqual([`${ORIGIN}/en/history/`]);
  });
});

describe("isHeldOffline", () => {
  it("needs the page and its payload, not one or the other", async () => {
    const held = new Set([`${ORIGIN}/en/history/`]);
    const match = async (key: string) => held.has(key);
    // The document alone is a reload, which is what the guard is avoiding.
    expect(await isHeldOffline("/en/history/", ORIGIN, match)).toBe(false);

    held.add(`${ORIGIN}/en/history/index.txt`);
    expect(await isHeldOffline("/en/history/", ORIGIN, match)).toBe(true);
  });

  it("accepts a payload stored under the query as well as the bare one", async () => {
    const held = new Set([
      `${ORIGIN}/en/tools/pdf-merge`,
      `${ORIGIN}/en/tools/pdf-merge/index.txt?from=%2F`,
    ]);
    expect(await isHeldOffline("/en/tools/pdf-merge?from=%2F", ORIGIN, async (key) => held.has(key))).toBe(
      true
    );
  });

  it("treats a cache it cannot reach as holding nothing", async () => {
    // The default lookup is guarded, so a click still resolves — to a document
    // load, which is the safe answer.
    await expect(isHeldOffline("/en/history/", ORIGIN)).resolves.toBe(false);
  });
});
