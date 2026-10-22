// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FileDropzone, type FileItem } from "./file-dropzone";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
afterEach(cleanup);

it("reorders file inputs without dragging and preserves both files", () => {
  const initial: FileItem[] = ["a.pdf", "b.pdf"].map((name) => ({ id: name, file: new File(["pdf"], name) }));
  function Fixture() {
    const [files, setFiles] = useState(initial);
    return <FileDropzone reorder files={files} onChange={setFiles} />;
  }
  render(<Fixture />);
  expect(screen.getByLabelText("moveEarlier · a.pdf")).toBeDisabled();
  fireEvent.click(screen.getByLabelText("moveLater · a.pdf"));
  const rows = screen.getAllByRole("listitem");
  expect(rows[0]).toHaveTextContent("b.pdf");
  expect(rows[1]).toHaveTextContent("a.pdf");
  fireEvent.click(screen.getByLabelText("moveEarlier · a.pdf"));
  expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("a.pdf");
});
