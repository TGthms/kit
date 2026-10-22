import { describe, expect, it } from "vitest";
import { offlineReadiness } from "./readiness";
import type { OfflinePlan, OfflineState } from "./offline-status";
const plan: OfflinePlan = { version: "1", generation: "build", locales: ["en"], tools: ["pdf-merge", "number-base"], pages: ["home", "settings", "offline"], engines: true, at: "" };
const state: OfflineState = {
  generation: "build", core: { done: 10, total: 10 }, engines: { done: 2, total: 2 },
  locales: {}, tools: { "pdf-merge": 1, "number-base": 1 }, readyLocales: 1, verifiedAt: 1,
  essentials: { en: { done: 6, total: 6, ready: true }, fr: { done: 0, total: 6, ready: false } },
  pages: { en: ["home", "settings", "offline"], fr: [] }, toolPages: { en: ["pdf-merge", "number-base", "currency-converter"], fr: [] },
  plan: { ...plan, ready: true },
};
describe("verified offline readiness", () => {
  it("requires verification and the current language's actual startup dependencies", () => {
    expect(offlineReadiness(state, "en", plan).ready).toBe(true);
    expect(offlineReadiness({ ...state, verifiedAt: null }, "en", plan).ready).toBe(false);
    expect(offlineReadiness(state, "fr", plan).ready).toBe(false);
  });
  it("does not count another language's pages as usable here", () => {
    expect(offlineReadiness(state, "fr", plan).usable.size).toBe(0);
  });
  it("requires engines for PDF/audio/video instead of advertising only their saved pages", () => {
    const result = offlineReadiness({ ...state, engines: { done: 1, total: 2 } }, "en", plan);
    expect(result.repair).toBe(true);
    expect(result.usable.has("pdf-merge")).toBe(false);
    expect(result.usable.has("number-base")).toBe(true);
  });
  it("keeps currency's live data explicitly conditional", () => {
    const result = offlineReadiness(state, "en", plan);
    expect(result.conditionalCurrency).toBe(true);
    expect(result.usable.has("currency-converter")).toBe(false);
  });
  it("can repair the saved selection when its cache record or files were evicted", () => {
    const missing = { ...state, plan: null, toolPages: { en: ["number-base"] } };
    expect(offlineReadiness(missing, "en", plan).repair).toBe(true);
  });
});
