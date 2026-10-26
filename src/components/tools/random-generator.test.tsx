// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import en from "../../../messages/en.json";
import { RandomGenerator } from "./random-generator";

vi.mock("@/components/ui/switch", () => ({ Switch: () => <input type="checkbox" /> }));
vi.mock("./shared", () => ({
  ToolShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ToolLimits: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ActionBar: ({ onRun }: { onRun: () => void }) => <button onClick={onRun}>Generate</button>,
  useToolHistory: () => vi.fn(), useHistoryNote: () => vi.fn(),
}));
vi.mock("@/components/shared/animated-number", () => ({ AnimatedNumber: ({ value, format }: { value: number; format?: Intl.NumberFormatOptions }) => <output>{new Intl.NumberFormat("en", format).format(value)}</output> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function setup() { render(<NextIntlClientProvider locale="en" messages={en}><RandomGenerator /></NextIntlClientProvider>); }
const mode = (key: "integer" | "decimal" | "pick" | "password") => screen.getByRole("button", { name: en.tools["random-generator"][key] });

it("passes results straight to the animation without an intermediate zero", () => {
  vi.spyOn(Math, "random").mockReturnValueOnce(0.49).mockReturnValueOnce(0.74);
  setup();
  fireEvent.click(screen.getByText("Generate"));
  expect(screen.getByRole("status")).toHaveTextContent("50");
  fireEvent.click(screen.getByText("Generate"));
  expect(screen.getByRole("status")).toHaveTextContent("75");
});

it("keeps a result's formatting stable while the next roll is being configured", () => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  setup();
  fireEvent.click(mode("decimal"));
  fireEvent.click(screen.getByText("Generate"));
  expect(screen.getByRole("status")).toHaveTextContent("50.50");
  fireEvent.change(screen.getByLabelText(en.tools["random-generator"].precision), { target: { value: "100" } });
  expect(screen.getByRole("status")).toHaveTextContent("50.50");
  fireEvent.click(screen.getByText("Generate"));
  expect(screen.getByRole("status")).toHaveTextContent("50.50");
  expect(screen.getByText(/precision must be between/)).toBeVisible();
});

it("does not expose password recording or reinterpret a password after switching mode", () => {
  setup();
  fireEvent.click(mode("password"));
  fireEvent.click(screen.getByText("Generate"));
  expect(screen.queryByRole("button", { name: en.tools["random-generator"].record })).not.toBeInTheDocument();
  fireEvent.click(mode("pick"));
  expect(screen.queryByRole("button", { name: en.tools["random-generator"].record })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: en.common.copy })).toBeEnabled();
});
