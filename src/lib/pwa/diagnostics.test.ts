import { describe, expect, it } from "vitest";
import { offlineDiagnostic } from "./diagnostics";
import type { OfflineState } from "./offline-status";
describe("reviewed diagnostics", () => {
  it("allowlists counts and release identifiers and omits arbitrary logs and selections", () => {
    const state = {
      generation: "abcd123",
      version: "1.2.7",
      verifiedAt: Infinity,
      tools: { "function-grapher": 1 },
      core: { done: 2, total: 3 },
      job: {
        status: "interrupted",
        done: 1,
        total: 3,
        logs: ["secret filename"],
        selection: { tools: ["sensitive"] },
      },
      filename: "secret",
      error: "private input",
      url: "https://secret.test",
    } as unknown as OfflineState;
    const text = JSON.stringify(offlineDiagnostic(state));
    expect(text).toContain("abcd123");
    expect(text).toContain('"toolCount":1');
    for (const secret of [
      "secret",
      "private",
      "sensitive",
      "function-grapher",
      "https",
    ])
      expect(text).not.toContain(secret);
  });
});
