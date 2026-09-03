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
  it("keeps the text in the document before the typewriter finishes", () => {
    render(<GreetingSubtitle motion="fade" play={false}>Kit keeps files on this device.</GreetingSubtitle>);
    expect(screen.getByText("Kit keeps files on this device.")).toBeInTheDocument();
    expect(screen.getByText("Kit keeps files on this device.").className).toContain("greeting-sub");
    expect(screen.getByText("Kit keeps files on this device.").className).not.toContain("greeting-sub--fade");
  });

  it("applies the context motion class when it is time to play", () => {
    render(
      <GreetingSubtitle motion="rise" play>
        A tiny tool can turn a tedious task into a two-minute win.
      </GreetingSubtitle>,
    );
    expect(screen.getByText(/tiny tool/).className).toContain("greeting-sub--rise");
  });
});
