// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { writeThemeContext } from "./resolve";
import { useThemeChoice } from "./use-theme-choice";
afterEach(() => { cleanup(); localStorage.clear(); });
it("updates intent even when Light and System resolve to the same color", () => {
  writeThemeContext({ choice: "light", system: "light" });
  const { result } = renderHook(useThemeChoice);
  expect(result.current).toBe("light");
  act(() => writeThemeContext({ choice: "system", system: "light" }));
  expect(result.current).toBe("system");
});
