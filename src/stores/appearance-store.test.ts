// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { useAppearanceStore } from "./appearance-store";

afterEach(() => { useAppearanceStore.setState({ liquidGlass: false }); localStorage.clear(); });

it("keeps the SDK opt-in and preserves an explicit choice", async () => {
  expect(useAppearanceStore.getInitialState().liquidGlass).toBe(false);
  useAppearanceStore.getState().setLiquidGlass(true);
  await useAppearanceStore.persist.rehydrate();
  expect(useAppearanceStore.getState().liquidGlass).toBe(true);
});

it("recovers invalid stored settings without replacing the action", async () => {
  localStorage.setItem("kit-appearance", JSON.stringify({ state: { liquidGlass: "invalid", setLiquidGlass: null }, version: 0 }));
  await useAppearanceStore.persist.rehydrate();
  expect(useAppearanceStore.getState().liquidGlass).toBe(false);
  expect(typeof useAppearanceStore.getState().setLiquidGlass).toBe("function");
});
