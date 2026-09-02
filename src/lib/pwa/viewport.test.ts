import { describe, expect, it } from "vitest";
import { isStandaloneDisplay, withLockedPageZoom } from "./viewport";

describe("isStandaloneDisplay", () => {
  it("treats iOS navigator.standalone as installed", () => {
    expect(isStandaloneDisplay({ standalone: true }, () => false)).toBe(true);
    expect(isStandaloneDisplay({ standalone: false }, () => false)).toBe(false);
  });

  it("treats standalone display-mode as installed", () => {
    expect(isStandaloneDisplay({}, (query) => query.includes("standalone"))).toBe(true);
    expect(isStandaloneDisplay(undefined, () => false)).toBe(false);
  });
});

describe("withLockedPageZoom", () => {
  it("appends lock tokens to the Next viewport content", () => {
    expect(withLockedPageZoom("width=device-width, initial-scale=1, viewport-fit=cover")).toBe(
      "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
    );
  });

  it("replaces an existing scale instead of duplicating", () => {
    expect(withLockedPageZoom("width=device-width, maximum-scale=5, user-scalable=yes")).toBe(
      "width=device-width, maximum-scale=1, user-scalable=no",
    );
  });
});
