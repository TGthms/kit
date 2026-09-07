// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { previousRecentPath, recordRecentPath, startRecentSession } from "./recent";

describe("recent path stack", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns null before anything is recorded", () => {
    expect(previousRecentPath()).toBeNull();
  });

  it("starts a fresh session instead of inheriting an old tab stack", () => {
    recordRecentPath("/old-page");
    recordRecentPath("/old-tool");
    startRecentSession("/deep-link");
    expect(previousRecentPath()).toBeNull();
    startRecentSession("/next-tool");
    expect(previousRecentPath()).toBe("/deep-link");
  });

  it("returns the path before the current one", () => {
    recordRecentPath("/how");
    expect(previousRecentPath()).toBeNull();
    recordRecentPath("/tools/pdf-merge");
    expect(previousRecentPath()).toBe("/how");
    recordRecentPath("/privacy");
    expect(previousRecentPath()).toBe("/tools/pdf-merge");
  });

  it("ignores consecutive duplicates (reload)", () => {
    recordRecentPath("/how");
    recordRecentPath("/how");
    recordRecentPath("/tools/pdf-merge");
    recordRecentPath("/tools/pdf-merge");
    expect(previousRecentPath()).toBe("/how");
  });

  it("tracks browser back and forward without reversing the stack", () => {
    recordRecentPath("/home");
    recordRecentPath("/how");
    recordRecentPath("/tools/pdf-merge");
    recordRecentPath("/how");
    expect(previousRecentPath()).toBe("/home");
    recordRecentPath("/tools/pdf-merge");
    expect(previousRecentPath()).toBe("/how");
  });

  it("caps the stack so old entries fall off", () => {
    for (let index = 0; index < 30; index += 1) {
      recordRecentPath(`/page-${index}`);
    }
    const previous = previousRecentPath();
    expect(previous).toMatch(/page-2[89]/);
  });

  it("ignores empty paths", () => {
    recordRecentPath("");
    expect(previousRecentPath()).toBeNull();
  });
});
