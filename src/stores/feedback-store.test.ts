// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { useFeedbackStore } from "./feedback-store";

afterEach(() => { useFeedbackStore.setState({ haptics: "full" }); localStorage.clear(); });

it("persists an explicit haptic preference", async () => {
  useFeedbackStore.getState().setHaptics("off");
  await useFeedbackStore.persist.rehydrate();
  expect(useFeedbackStore.getState().haptics).toBe("off");
});

it("sanitizes stored preferences without overwriting actions", async () => {
  localStorage.setItem("kit-feedback", JSON.stringify({ state: { haptics: "invalid", setHaptics: null }, version: 0 }));
  await useFeedbackStore.persist.rehydrate();
  expect(useFeedbackStore.getState().haptics).toBe("full");
  expect(typeof useFeedbackStore.getState().setHaptics).toBe("function");
});
