// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { DEFAULT_GLASS_TRANSPARENCY } from "@/lib/theme/glass-transparency";
import { useAppearanceStore } from "./appearance-store";

afterEach(() => { useAppearanceStore.setState(useAppearanceStore.getInitialState()); localStorage.clear(); });

it("keeps the SDK opt-in and preserves an explicit choice", async () => {
  expect(useAppearanceStore.getInitialState().liquidGlass).toBe(false);
  useAppearanceStore.getState().setLiquidGlass(true);
  useAppearanceStore.getState().setGlassTransparency(0);
  await useAppearanceStore.persist.rehydrate();
  expect(useAppearanceStore.getState().liquidGlass).toBe(true);
  expect(useAppearanceStore.getState().glassTransparency).toBe(0);
  useAppearanceStore.getState().setGlassTransparency(101);
  expect(useAppearanceStore.getState().glassTransparency).toBe(0);
});

it("recovers invalid stored settings without replacing the action", async () => {
  localStorage.setItem("kit-appearance", JSON.stringify({ state: { liquidGlass: "invalid", setLiquidGlass: null, glassTransparency: "75" }, version: 0 }));
  await useAppearanceStore.persist.rehydrate();
  expect(useAppearanceStore.getState().liquidGlass).toBe(false);
  expect(typeof useAppearanceStore.getState().setLiquidGlass).toBe("function");
  expect(useAppearanceStore.getState().glassTransparency).toBe(DEFAULT_GLASS_TRANSPARENCY);
});
