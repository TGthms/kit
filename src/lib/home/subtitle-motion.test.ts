import { describe, expect, it } from "vitest";
import { subtitleMotionFor } from "./subtitle-motion";

describe("subtitle motion", () => {
  it("keeps solemn days to a fade and festive days to a soft scale", () => {
    expect(subtitleMotionFor({ occasionKey: "goodFriday", category: "kit", period: "morning", greetingKey: "greeting.observance.goodFriday" })).toBe("fade");
    expect(subtitleMotionFor({ occasionKey: "palmSunday", category: "kit", period: "afternoon", greetingKey: "greeting.observance.palmSunday" })).toBe("fade");
    expect(subtitleMotionFor({ occasionKey: "christmas", category: "kit", period: "morning", greetingKey: "greeting.observance.christmas" })).toBe("scaleSoft");
    expect(subtitleMotionFor({ occasionKey: "piDay", category: "kit", period: "afternoon", greetingKey: "greeting.observance.piDay" })).toBe("scaleSoft");
    expect(subtitleMotionFor({ occasionKey: "dataPrivacyDay", category: "kit", period: "morning", greetingKey: "greeting.observance.dataPrivacyDay" })).toBe("fade");
  });

  it("maps ordinary categories without bounce or glitch", () => {
    expect(subtitleMotionFor({ category: "kit", period: "morning", greetingKey: "greeting.kit" })).toBe("fade");
    expect(subtitleMotionFor({ category: "privacy", period: "night", greetingKey: "greeting.privacy" })).toBe("fade");
    expect(subtitleMotionFor({ category: "productivity", period: "afternoon", greetingKey: "greeting.productivity" })).toBe("rise");
    expect(subtitleMotionFor({ category: "weekend", period: "morning", greetingKey: "greeting.weekend" })).toBe("rise");
    expect(subtitleMotionFor({ category: "timeOfDay", period: "morning", greetingKey: "greeting.morning" })).toBe("rise");
    expect(subtitleMotionFor({ category: "timeOfDay", period: "afternoon", greetingKey: "greeting.afternoon" })).toBe("fade");
    expect(subtitleMotionFor({ category: "timeOfDay", period: "night", greetingKey: "greeting.night" })).toBe("fadeSlow");
    expect(subtitleMotionFor({ category: "timeOfDay", period: "afternoon", greetingKey: "greeting.friday" })).toBe("rise");
  });
});
