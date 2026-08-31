import { describe, expect, it } from "vitest";
import { safeSummary } from "./history-store";

describe("history summaries", () => {
  it("keeps conversion and clock values", () => {
    expect(safeSummary("1.5 km → 0.932 mi", "success")).toBe("1.5 km → 0.932 mi");
    expect(safeSummary("100 USD → 92.1 EUR", "success")).toBe("100 USD → 92.1 EUR");
    expect(safeSummary("00:01:23.40", "success")).toBe("00:01:23.40");
    expect(safeSummary("integer × 5: 4, 8, 15", "success")).toBe("integer × 5: 4, 8, 15");
    expect(safeSummary("pick: red, blue", "success")).toBe("pick: red, blue");
    expect(safeSummary("pick × 3: red, blue, green", "success")).toBe("pick × 3: red, blue, green");
    expect(safeSummary("12 words, 70 characters", "success")).toBe("12 words, 70 characters");
    expect(safeSummary("BMI 22.9 · 2136 kcal", "success")).toBe("BMI 22.9 · 2136 kcal");
  });

  it("still redacts free-form input", () => {
    expect(safeSummary("Merged family-taxes.pdf", "success")).toBe("completed");
    expect(safeSummary("pick: secret passphrase", "success")).toBe("pick: secret passphrase");
    expect(safeSummary("password: hunter2", "success")).toBe("completed");
    expect(safeSummary("password", "success")).toBe("password");
    expect(safeSummary("password × 3", "success")).toBe("password × 3");
    expect(safeSummary("boom", "failed")).toBe("failed");
  });
});
