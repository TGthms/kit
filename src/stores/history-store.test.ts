import { beforeEach, describe, expect, it } from "vitest";
import { safeSummary, useHistoryStore } from "./history-store";

// @vitest-environment jsdom

describe("history summaries", () => {
  it("keeps conversion and clock values", () => {
    expect(safeSummary("1.5 km → 0.932 mi", "success")).toBe("1.5 km → 0.932 mi");
    expect(safeSummary("100 USD → 92.1 EUR", "success")).toBe("100 USD → 92.1 EUR");
    expect(safeSummary("00:01:23.40", "success")).toBe("00:01:23.40");
    expect(safeSummary("integer × 5: 4, 8, 15", "success")).toBe("integer × 5: 4, 8, 15");
    expect(safeSummary("pick × 3", "success")).toBe("pick × 3");
    expect(safeSummary("md→html", "success")).toBe("md→html");
    expect(safeSummary("America/New_York → Europe/London", "success")).toBe("America/New_York → Europe/London");
    expect(safeSummary("12 words, 70 characters", "success")).toBe("12 words, 70 characters");
    expect(safeSummary("BMI 22.9 · 2136 kcal", "success")).toBe("BMI 22.9 · 2136 kcal");
  });

  it("still redacts free-form input", () => {
    expect(safeSummary("Merged family-taxes.pdf", "success")).toBe("completed");
    expect(safeSummary("Merged family-taxes.pdf → out.pdf", "success")).toBe("completed");
    expect(safeSummary("pick: secret passphrase", "success")).toBe("completed");
    expect(safeSummary("pick × 3: red, blue, green", "success")).toBe("completed");
    expect(safeSummary("password: hunter2", "success")).toBe("completed");
    expect(safeSummary("password", "success")).toBe("password");
    expect(safeSummary("password × 3", "success")).toBe("password × 3");
    expect(safeSummary("boom", "failed")).toBe("failed");
    expect(safeSummary("a".repeat(120), "success")).toBe("completed");
  });
});

describe("history recording", () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: [], enabled: false });
  });

  it("records nothing while the opt-in is off, even on a direct add()", () => {
    useHistoryStore.getState().add({ toolId: "pdf-merge", summary: "completed", status: "success" });
    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it("keeps only finite-number and boolean options", () => {
    useHistoryStore.getState().setEnabled(true);
    useHistoryStore.getState().add({
      toolId: "image-compress",
      summary: "completed",
      status: "success",
      options: { q: 80, label: "secret-name", weird: Number.NaN, ok: true },
    });
    expect(useHistoryStore.getState().entries[0].options).toEqual({ q: 80, ok: true });
  });
});
