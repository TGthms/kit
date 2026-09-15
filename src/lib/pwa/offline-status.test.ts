// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_PAGE_IDS } from "./app-pages";
import {
  clearPlan,
  getPlanSnapshot,
  localeState,
  OFFLINE_PLAN_KEY,
  parsePlan,
  planStatus,
  savePlan,
  subscribePlan,
  toolSaved,
  toolSavedCount,
  type OfflinePlan,
  type OfflineState,
} from "./offline-status";

const plan: OfflinePlan = {
  version: "1.1.0",
  generation: "3f9a1c4e77b2",
  locales: ["en", "fr"],
  tools: ["pdf-merge"],
  pages: ["home", "history"],
  engines: true,
  at: "2026-09-13T00:00:00.000Z",
};

function state(overrides: Partial<OfflineState> = {}): OfflineState {
  return {
    generation: "3f9a1c4e77b2",
    core: { done: 167, total: 167 },
    engines: { done: 203, total: 203 },
    locales: { en: { done: 12, total: 12, ready: true }, fr: { done: 0, total: 12, ready: false } },
    tools: { "pdf-merge": 1, "world-clock": 0 },
    readyLocales: 1,
    ...overrides,
  };
}

/** Nothing at all is stored. */
function emptyState(): OfflineState {
  return state({ locales: { en: { done: 0, total: 12, ready: false } }, tools: {}, readyLocales: 0 });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("planStatus", () => {
  it("says nothing without a record or without a report", () => {
    expect(planStatus(null, state(), "1.1.0")).toBe("none");
    expect(planStatus(plan, null, "1.1.0")).toBe("none");
  });

  it("calls saved content current when the release and the cache agree", () => {
    expect(planStatus(plan, state(), "1.1.0")).toBe("saved");
  });

  it("calls saved content stale when the running release is newer", () => {
    expect(planStatus(plan, state(), "1.2.0")).toBe("stale");
  });

  it("calls saved content stale when the cache has moved on", () => {
    expect(planStatus(plan, state({ generation: "v14" }), "1.1.0")).toBe("stale");
  });

  it("reports a roll that took the content with it", () => {
    // A new release replaced the cache, so there is nothing left to describe as
    // out of date — but the visitor should still be told.
    expect(planStatus(plan, emptyState(), "1.1.0")).toBe("none");
    expect(planStatus(plan, { ...emptyState(), generation: "v14" }, "1.1.0")).toBe("cleared");
  });

  it("stays quiet when the visitor removed what they downloaded", () => {
    // Same cache, nothing stored: they cleared it themselves.
    expect(planStatus(plan, emptyState(), "1.1.0")).toBe("none");
  });

  it("stays quiet when only part of a language was removed and one is still complete", () => {
    const partial = state({ locales: { en: { done: 12, total: 12, ready: true }, fr: { done: 0, total: 12, ready: false } } });
    expect(planStatus(plan, partial, "1.1.0")).toBe("saved");
  });
});

describe("tool availability", () => {
  it("counts a tool as available only where every complete language holds it", () => {
    expect(toolSaved(state(), "pdf-merge")).toBe(true);
    expect(toolSavedCount(state(), "pdf-merge")).toBe(1);
    // A tool no language holds is not available offline.
    expect(toolSaved(state({ tools: {} }), "pdf-merge")).toBe(false);
    expect(toolSavedCount(state({ tools: {} }), "pdf-merge")).toBe(0);
  });

  it("does not claim anything is available when no language is complete", () => {
    expect(toolSaved(emptyState(), "pdf-merge")).toBe(false);
    expect(toolSaved(null, "pdf-merge")).toBe(false);
  });

  it("needs the tool in every complete language, not just one", () => {
    const two = state({ tools: { "pdf-merge": 1 }, readyLocales: 2 });
    expect(toolSaved(two, "pdf-merge")).toBe(false);
    expect(toolSaved({ ...two, tools: { "pdf-merge": 2 } }, "pdf-merge")).toBe(true);
  });

  it("resolves a tool id to its public route segment", () => {
    // timezone-converter is served at /tools/world-clock/.
    expect(toolSaved(state({ tools: { "world-clock": 1 } }), "timezone-converter")).toBe(true);
  });

  it("reads one language's progress", () => {
    expect(localeState(state(), "en")).toEqual({ done: 12, total: 12, ready: true });
    expect(localeState(state(), "de")).toBeNull();
    expect(localeState(null, "en")).toBeNull();
  });
});

describe("the stored record", () => {
  it("round-trips through storage and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePlan(listener);
    expect(getPlanSnapshot()).toBeNull();

    savePlan(plan);
    expect(listener).toHaveBeenCalled();
    expect(getPlanSnapshot()).toEqual(plan);

    clearPlan();
    expect(getPlanSnapshot()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("gives back the same object while the stored text is unchanged", () => {
    savePlan(plan);
    // A fresh object each call would make React re-render forever.
    expect(getPlanSnapshot()).toBe(getPlanSnapshot());
  });

  it("ignores a record that is not a record", () => {
    expect(parsePlan(null)).toBeNull();
    expect(parsePlan("not json")).toBeNull();
    expect(parsePlan(JSON.stringify({ version: "1.1.0" }))).toBeNull();
    expect(parsePlan(JSON.stringify({ version: 1, locales: [], tools: [] }))).toBeNull();
    expect(parsePlan(JSON.stringify({ version: "1.1.0", locales: "en", tools: [] }))).toBeNull();
  });

  it("fills in what the record leaves out", () => {
    /* With no page list the record asked for the whole app: every page exists
       for every language, and leaving one out is a choice it could not make. */
    expect(parsePlan(JSON.stringify({ version: "1.1.0", locales: ["en"], tools: [] }))).toEqual({
      version: "1.1.0",
      generation: "",
      locales: ["en"],
      tools: [],
      pages: [...APP_PAGE_IDS],
      engines: false,
      at: "",
    });
  });

  it("keeps a recorded page selection, and drops an id it does not know", () => {
    const recorded = parsePlan(
      JSON.stringify({ version: "1.1.0", locales: ["en"], tools: [], pages: ["history", "gone"] })
    );
    expect(recorded?.pages).toEqual(["history"]);
    const none = parsePlan(JSON.stringify({ version: "1.1.0", locales: ["en"], tools: [], pages: [] }));
    expect(none?.pages).toEqual([]);
  });

  it("survives storage being unavailable", () => {
    const get = vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getPlanSnapshot()).toBeNull();
    expect(() => savePlan(plan)).not.toThrow();
    expect(() => clearPlan()).not.toThrow();
    get.mockRestore();
  });

  it("uses a key of its own", () => {
    expect(OFFLINE_PLAN_KEY).toBe("kit-offline-plan");
  });
});
