// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { GreetingSubtitle } from "./greeting-subtitle";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
});

describe("GreetingSubtitle", () => {
  it("applies the context motion class as soon as it mounts", () => {
    render(<GreetingSubtitle motion="fade">Kit keeps files on this device.</GreetingSubtitle>);
    expect(screen.getByText("Kit keeps files on this device.")).toBeInTheDocument();
    expect(screen.getByText("Kit keeps files on this device.").className).toContain("greeting-sub--fade");
  });

  it("maps a slow fade without a play gate", () => {
    render(
      <GreetingSubtitle motion="fadeSlow">
        A tiny tool can turn a tedious task into a two-minute win.
      </GreetingSubtitle>,
    );
    expect(screen.getByText(/tiny tool/).className).toContain("greeting-sub--fadeSlow");
  });

  it("skips motion when reduced motion is preferred", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false;
        },
      }),
    });
    render(<GreetingSubtitle motion="fadeSlow">Quiet work still counts.</GreetingSubtitle>);
    expect(screen.getByText("Quiet work still counts.").className).toContain("greeting-sub--instant");
    expect(screen.getByText("Quiet work still counts.").className).not.toContain("greeting-sub--fadeSlow");
  });
});
