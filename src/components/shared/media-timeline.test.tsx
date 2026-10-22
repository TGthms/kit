// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MediaTimeline } from "./media-timeline";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("exposes keyboard sliders and prevents negative or crossing endpoints", async () => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:media");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  const media: HTMLMediaElement[] = [];
  const original = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
    const el = original(tag, options);
    if (tag === "audio") media.push(el as HTMLMediaElement);
    return el;
  });
  const file = new File([""], "large.mp3", { type: "audio/mpeg" });
  Object.defineProperty(file, "size", { value: 13 * 1024 * 1024 });
  function Fixture() {
    const [range, setRange] = useState([2, 8]);
    return <MediaTimeline file={file} start={range[0]} end={range[1]} startLabel="Start" endLabel="End" onChange={(start, end) => setRange([start, end])} />;
  }
  render(<Fixture />);
  Object.defineProperty(media[0], "duration", { value: 10 });
  await act(async () => media[0].dispatchEvent(new Event("loadedmetadata")));
  const start = screen.getByRole("slider", { name: "Start" });
  const end = screen.getByRole("slider", { name: "End" });
  fireEvent.keyDown(start, { key: "ArrowRight" });
  expect(start).toHaveAttribute("aria-valuenow", "2.05");
  fireEvent.keyDown(start, { key: "Home" });
  expect(start).toHaveAttribute("aria-valuenow", "0");
  fireEvent.keyDown(end, { key: "End" });
  expect(end).toHaveAttribute("aria-valuenow", "10");
  fireEvent.keyDown(start, { key: "End" });
  expect(start).toHaveAttribute("aria-valuenow", "9.95");
  fireEvent.keyDown(end, { key: "Home" });
  expect(end).toHaveAttribute("aria-valuenow", "10");
});
