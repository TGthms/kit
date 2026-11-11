// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from "vitest";
import {
  draftKey,
  freshGraph,
  parseGraph,
  parseGraphLibrary,
  parseMathDraft,
  setRecoveryEnabled,
} from "./math";
import {
  clearHandoff,
  stageHandoff,
  takeHandoff,
  HANDOFF_BYTES,
} from "./handoff";
import { parsePreferences, type Preferences } from "./preferences";
import { importPreferences } from "./import-preferences";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useAppearanceStore } from "@/stores/appearance-store";
const preferences: Preferences = {
  kind: "kit-preferences",
  version: 1,
  locale: "en",
  theme: "dark",
  favorites: ["function-grapher"],
  haptics: "reduced",
  liquidGlass: false,
  showObservances: false,
  mathRecovery: true,
};
afterEach(() => {
  vi.restoreAllMocks();
  clearHandoff();
  localStorage.clear();
});
describe("bounded math documents", () => {
  it("round-trips expressions, viewport, colors and parameters without unrelated properties", () => {
    const doc = freshGraph();
    doc.curves[0].latex = "x^2";
    doc.parameters.a = 2;
    expect(parseGraph({ ...doc, token: "secret" })).toEqual(doc);
    expect(
      parseGraph({ ...doc, view: { ...doc.view, xMax: Infinity } }),
    ).toBeNull();
    expect(
      parseGraph({ ...doc, curves: Array(9).fill(doc.curves[0]) }),
    ).toBeNull();
    expect(
      parseGraph({
        ...doc,
        curves: [{ ...doc.curves[0], color: "url(https://evil.test)" }],
      }),
    ).toBeNull();
    expect(
      parseGraph({ ...doc, parameters: { a: "2", b: 1, c: 1 } }),
    ).toBeNull();
  });
  it("rejects oversized expressions and damaged saved libraries", () => {
    expect(
      parseMathDraft("scientific-calculator", { value: "a".repeat(4001) }),
    ).toBeNull();
    expect(() =>
      parseGraphLibrary([{ id: "bad", name: "bad", document: {} }]),
    ).toThrow();
    const graph = { id: "one", name: "A", document: freshGraph() };
    expect(() => parseGraphLibrary([graph, graph])).toThrow();
  });
  it("clears automatic drafts when disabled while retaining explicit graphs", () => {
    localStorage.setItem(draftKey("graph"), JSON.stringify(freshGraph()));
    localStorage.setItem("kit-graphs-v1", "saved");
    setRecoveryEnabled(false);
    expect(localStorage.getItem(draftKey("graph"))).toBeNull();
    expect(localStorage.getItem("kit-graphs-v1")).toBe("saved");
  });
});
describe("ephemeral file handoffs", () => {
  const file = () => new File(["pixels"], "photo.png", { type: "image/png" });
  it("is consumed only once by its intended tool and expires", () => {
    expect(stageHandoff("image-convert", [file()], 0)).toBe(true);
    expect(takeHandoff("images-to-pdf", 1)).toBeNull();
    expect(takeHandoff("image-convert", 1)?.[0].name).toBe("photo.png");
    expect(takeHandoff("image-convert", 2)).toBeNull();
    stageHandoff("image-convert", [file()], 0);
    expect(takeHandoff("image-convert", 300001)).toBeNull();
  });
  it("rejects unsupported types and oversized transfers", () => {
    expect(
      stageHandoff("image-convert", [
        new File(["x"], "doc.pdf", { type: "application/pdf" }),
      ]),
    ).toBe(false);
    const large = file();
    Object.defineProperty(large, "size", { value: HANDOFF_BYTES + 1 });
    expect(stageHandoff("image-convert", [large])).toBe(false);
  });
});
describe("preferences transfer", () => {
  it("rejects unknown fields, unknown tools, duplicates and wrong types", () => {
    expect(parsePreferences(JSON.stringify(preferences))).toEqual(preferences);
    for (const change of [
      { history: [] },
      { favorites: ["no-tool"] },
      { favorites: ["function-grapher", "function-grapher"] },
      { version: 99 },
      { liquidGlass: "false" },
      { glassTransparency: -1 },
      { glassTransparency: 101 },
      { glassTransparency: "50" },
    ])
      expect(() =>
        parsePreferences(JSON.stringify({ ...preferences, ...change })),
      ).toThrow();
  });
  it("imports allowlisted preferences without enabling history or reading inputs", () => {
    localStorage.setItem("kit-history", "untouched");
    localStorage.setItem(draftKey("graph"), "untouched");
    const settings = { ...preferences, liquidGlass: true, glassTransparency: 0 };
    importPreferences(parsePreferences(JSON.stringify(settings)));
    expect(useFavoritesStore.getState().ids).toEqual(["function-grapher"]);
    expect(localStorage.getItem("kit-history")).toBe("untouched");
    expect(localStorage.getItem(draftKey("graph"))).toBe("untouched");
    expect(useAppearanceStore.getState()).toMatchObject({ liquidGlass: true, glassTransparency: 0 });
  });
  it("rolls back completed writes on quota failure without changing live stores", () => {
    localStorage.setItem(
      "kit-favorites",
      JSON.stringify({ state: { ids: [] }, version: 1 }),
    );
    useFavoritesStore.setState({ ids: [] });
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === "kit-appearance")
        throw new DOMException("full", "QuotaExceededError");
      return original.call(this, key, value);
    });
    expect(() => importPreferences(preferences)).toThrow();
    expect(
      JSON.parse(localStorage.getItem("kit-favorites")!).state.ids,
    ).toEqual([]);
    expect(useFavoritesStore.getState().ids).toEqual([]);
  });
});

it("exports and validates a bounded graph envelope", async () => {
  const { graphFile, parseGraphFile } = await import("./math");
  expect(parseGraphFile(graphFile("Parabola", freshGraph()))).toEqual({ name: "Parabola", document: freshGraph() });
  expect(() => parseGraphFile(JSON.stringify({ kind: "kit-preferences", version: 1 }))).toThrow();
  expect(() => parseGraphFile(" ".repeat(40001))).toThrow();
  expect(() => parseGraphFile(JSON.stringify({ kind: "kit-graph", version: 1, name: "bad", document: { ...freshGraph(), view: {} } }))).toThrow();
});
