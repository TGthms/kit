// @vitest-environment jsdom
import { useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMathDraft } from "./use-math-draft";
import { draftKey, setRecoveryEnabled } from "./math";
function Editor() {
  const [value, setValue] = useState("");
  const result = useMathDraft("equation-solver", { value }, (draft) =>
    setValue(draft.value),
  );
  return (
    <>
      <input
        aria-label="expression"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <span>{result.failed ? "failed" : "ok"}</span>
    </>
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
describe("math recovery", () => {
  it("restores after hydration, flushes latest edits on hide, and never overwrites with the empty mount", () => {
    localStorage.setItem(
      draftKey("equation-solver"),
      JSON.stringify({ value: "x^2=2" }),
    );
    const view = render(<Editor />);
    expect(
      (screen.getByLabelText("expression") as HTMLInputElement).value,
    ).toBe("x^2=2");
    fireEvent.change(screen.getByLabelText("expression"), {
      target: { value: "3x=9" },
    });
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(
      JSON.parse(localStorage.getItem(draftKey("equation-solver"))!).value,
    ).toBe("3x=9");
    view.unmount();
    render(<Editor />);
    expect(
      (screen.getByLabelText("expression") as HTMLInputElement).value,
    ).toBe("3x=9");
  });
  it("does not persist when disabled and tolerates damaged or denied storage", () => {
    setRecoveryEnabled(false);
    const view = render(<Editor />);
    fireEvent.change(screen.getByLabelText("expression"), {
      target: { value: "private" },
    });
    view.unmount();
    expect(localStorage.getItem(draftKey("equation-solver"))).toBeNull();
    localStorage.clear();
    localStorage.setItem(draftKey("equation-solver"), "{broken");
    render(<Editor />);
    expect(
      (screen.getByLabelText("expression") as HTMLInputElement).value,
    ).toBe("");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    act(() => window.dispatchEvent(new Event("pagehide")));
    expect(screen.getByText("failed")).toBeTruthy();
  });
});
