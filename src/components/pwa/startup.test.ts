import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DocumentHead } from "../layout/document-head";
import { STARTUP_SCREENS } from "@/lib/pwa/startup-screens";

describe("cold-launch setup", () => {
  it("inlines first-paint setup without waiting for external boot scripts", () => {
    const head = renderToStaticMarkup(createElement(DocumentHead));
    expect(head).not.toMatch(/<script[^>]+src=/);
    expect(head).toContain("kit-theme-context");
    expect(head).toContain("navigator.standalone");
    expect(head).toContain("document.documentElement.lang");
    // Locale selection is painted by LocaleGate; no pre-paint redirect can
    // replace the loading screen with a second blank document request.
    expect(head).not.toContain("location.replace");
  });
  it("has exact native launch sizes, with both appearances and orientations", () => {
    expect(STARTUP_SCREENS).toContainEqual({ width: 440, height: 956, scale: 3 });
    const head = renderToStaticMarkup(createElement(DocumentHead));
    for (const { width, height, scale } of STARTUP_SCREENS) {
      for (const orientation of ["portrait", "landscape"]) for (const appearance of ["light", "dark"]) {
        const name = `${width}-${height}-${scale}-${orientation}-${appearance}.png`;
        const png = readFileSync(`public/startup/${name}`);
        expect(png.subarray(1, 4).toString()).toBe("PNG");
        expect(png.readUInt32BE(16)).toBe((orientation === "portrait" ? width : height) * scale);
        expect(png.readUInt32BE(20)).toBe((orientation === "portrait" ? height : width) * scale);
        expect(head).toContain(`/startup/${name}`);
      }
    }
  });
});
