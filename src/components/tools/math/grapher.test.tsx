// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../../../messages/en.json";
import { FunctionGrapher } from "./grapher";
import type { MathRequest } from "@/lib/math/client";
const { requests, dispose } = vi.hoisted(() => ({
  requests: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock("@/lib/math/client", () => ({
  GraphClient: class {
    run(request: MathRequest) {
      requests(request);
      return Promise.resolve({
        ok: true,
        result: request.curves?.map((curve) => ({
          id: curve.id,
          latex: curve.latex,
          parameters: ["a"],
          plot: curve.hidden
            ? undefined
            : {
                expression: ["Power", "x", 2],
                definitions: {},
                segments: [
                  [
                    [0, 0],
                    [1, 1],
                  ],
                ],
                table: Array.from({ length: 9 }, (_, i) => [i, i * i]),
              },
        })),
      });
    }
    dispose = dispose;
  },
}));
vi.mock("./math-input", () => ({
  MathInput: ({
    value,
    label,
    onChange,
  }: {
    value: string;
    label: string;
    onChange: (v: string) => void;
  }) => (
    <input
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock("@/components/ui/slider", () => ({
  Slider: ({
    value,
    onValueChange,
    ...props
  }: {
    value: number[];
    onValueChange: (v: number[]) => void;
  }) => (
    <input
      {...props}
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
    />
  ),
}));
beforeEach(() => {
  requests.mockClear();
  dispose.mockClear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <FunctionGrapher />
    </NextIntlClientProvider>,
  );
}
describe("graph workspace", () => {
  it("supports eight independently named functions and stops at the cap", () => {
    setup();
    for (let i = 1; i < 8; i++)
      fireEvent.click(screen.getByRole("button", { name: "Add function" }));
    expect(screen.getByRole("button", { name: "Add function" })).toBeDisabled();
    expect(
      screen.getAllByRole("textbox", { name: /Function name/ }),
    ).toHaveLength(8);
    fireEvent.change(screen.getByRole("textbox", { name: "Function name 3" }), {
      target: { value: "z" },
    });
    expect(screen.getByRole("textbox", { name: "z(x) =" })).toBeInTheDocument();
  });
  it("keeps hidden functions in the dependency request and skips recomputing colors", async () => {
    setup();
    await waitFor(() => expect(requests).toHaveBeenCalled());
    const count = requests.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Graph color f(x)"), {
      target: { value: "#ff0000" },
    });
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(requests).toHaveBeenCalledTimes(count);
    fireEvent.click(screen.getByRole("button", { name: "Hide f(x)" }));
    await waitFor(() =>
      expect(requests.mock.lastCall?.[0].curves[0].hidden).toBe(true),
    );
  });
  it("traces exact numeric evaluation and updates parameters", async () => {
    setup();
    await waitFor(() =>
      expect(
        screen.getByRole("spinbutton", { name: "Parameter a" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Trace coordinates" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Trace at x" }), {
      target: { value: "2" },
    });
    expect(screen.getByText("f(2) = 4")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Parameter a" }), {
      target: { value: "3" },
    });
    await waitFor(() =>
      expect(requests.mock.lastCall?.[0].parameters.a).toBe(3),
    );
  });
  it("rejects invalid bounds and applies valid ones", async () => {
    setup();
    fireEvent.click(screen.getByText("Graph settings", { exact: true }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Minimum x" }), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply bounds" }));
    expect(screen.getByRole("alert")).toHaveTextContent("in increasing order");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Minimum x" }), {
      target: { value: "-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply bounds" }));
    await waitFor(() =>
      expect(requests.mock.lastCall?.[0].viewport.xMin).toBe(-2),
    );
  });
  it("restores the page and focus on leaving expanded view", () => {
    setup();
    const expand = screen.getByRole("button", { name: "Expand workspace" });
    expand.focus();
    fireEvent.click(expand);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(
      screen.getByRole("button", { name: "Expand workspace" }),
    ).toHaveFocus();
  });
});
