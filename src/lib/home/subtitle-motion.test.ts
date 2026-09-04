import { describe, expect, it } from "vitest";
import { subtitleMotionFor } from "./subtitle-motion";

describe("subtitle motion", () => {
  it("keeps solemn days and night hours to a slow fade", () => {
    expect(subtitleMotionFor({ occasionKey: "goodFriday", period: "morning" })).toBe("fadeSlow");
    expect(subtitleMotionFor({ occasionKey: "palmSunday", period: "afternoon" })).toBe("fadeSlow");
    expect(subtitleMotionFor({ period: "evening" })).toBe("fadeSlow");
    expect(subtitleMotionFor({ period: "night" })).toBe("fadeSlow");
  });

  it("uses a plain fade for everything else, including festive days", () => {
    expect(subtitleMotionFor({ occasionKey: "christmas", period: "morning" })).toBe("fade");
    expect(subtitleMotionFor({ occasionKey: "piDay", period: "afternoon" })).toBe("fade");
    expect(subtitleMotionFor({ occasionKey: "dataPrivacyDay", period: "morning" })).toBe("fade");
    expect(subtitleMotionFor({ period: "morning" })).toBe("fade");
    expect(subtitleMotionFor({ period: "afternoon" })).toBe("fade");
  });
});
