import { describe, expect, it } from "vitest";
import { greetingInlineLink } from "./greeting-links";

describe("greetingInlineLink", () => {
  it("sends World Password Day to the password generator", () => {
    expect(greetingInlineLink("subtitleObservance.passwordDay2")).toEqual({
      tag: "tool",
      toolId: "password-generator",
    });
  });

  it("sends privacy-themed kit facts to How Kit works", () => {
    expect(greetingInlineLink("subtitleFacts.kit6")).toEqual({ tag: "page", href: "/how" });
    expect(greetingInlineLink("subtitleObservance.dataPrivacyDay2")).toEqual({ tag: "page", href: "/how" });
  });

  it("leaves ordinary morning lines alone", () => {
    expect(greetingInlineLink("subtitleFacts.morning1")).toBeUndefined();
  });
});
