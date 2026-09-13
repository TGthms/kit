import { describe, expect, it } from "vitest";
import { canBacktrackUnboundedly, replaceRegexAsync, runRegex, runRegexAsync } from "./regex";

describe("canBacktrackUnboundedly", () => {
  it("flags a quantified group whose body can vary in length", () => {
    for (const pattern of ["(a+)+", "(a*)*", "(a?)?", "(\\d+)+", "([a-z]+)*", "(\\d{2,})+", "(a+)+$"]) {
      expect(canBacktrackUnboundedly(pattern), pattern).toBe(true);
    }
  });

  it("leaves patterns that consume a fixed amount per step alone", () => {
    for (const pattern of ["(\\d+)-(\\d+)", "(a|b)+", "(foo)+", "(?:ab)+", "(foo){2,4}", "abc", "[a-z]+"]) {
      expect(canBacktrackUnboundedly(pattern), pattern).toBe(false);
    }
  });
});

describe("main-thread fallback", () => {
  it("still answers ordinary patterns without a worker", async () => {
    const result = await runRegexAsync("a+", "g", "aaa b aa");
    expect(result.ok).toBe(true);
    expect(result.ok && result.matches.map((m) => m.text)).toEqual(["aaa", "aa"]);
  });

  it("refuses a pattern that could backtrack without bound", async () => {
    const result = await runRegexAsync("(a+)+$", "g", `${"a".repeat(40)}!`);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/background worker/i);
  });

  it("refuses the same shape for replacement", async () => {
    const result = await replaceRegexAsync("(a+)+$", "g", `${"a".repeat(40)}!`, "x");
    expect(result.ok).toBe(false);
  });

  it("keeps the synchronous path available for callers that want it", () => {
    expect(runRegex("a+", "g", "aaa").ok).toBe(true);
  });
});
