import { describe, expect, it } from "vitest";
import { classifyDroppedFiles, fileMatchesAccept } from "@/lib/files/accept";
import { MAX_FILE_BYTES } from "@/lib/utils";

function file(name: string, type: string): File {
  return new File(["x"], name, { type });
}

describe("fileMatchesAccept", () => {
  it("accepts PDFs by MIME or .pdf extension when the OS leaves type empty", () => {
    expect(fileMatchesAccept(file("notes.pdf", "application/pdf"), "application/pdf")).toBe(true);
    expect(fileMatchesAccept(file("notes.PDF", ""), "application/pdf")).toBe(true);
    expect(fileMatchesAccept(file("photo.png", "image/png"), "application/pdf")).toBe(false);
  });

  it("accepts images by prefix or common extensions", () => {
    expect(fileMatchesAccept(file("a.jpg", "image/jpeg"), "image/*")).toBe(true);
    expect(fileMatchesAccept(file("a.webp", ""), "image/*")).toBe(true);
    expect(fileMatchesAccept(file("a.pdf", "application/pdf"), "image/*")).toBe(false);
    expect(fileMatchesAccept(file("a.heic", ""), "image/*")).toBe(false);
    expect(fileMatchesAccept(file("a.tiff", ""), "image/*")).toBe(false);
  });

  it("accepts audio and video by extension when MIME is empty", () => {
    expect(fileMatchesAccept(file("clip.mp4", ""), "video/*")).toBe(true);
    expect(fileMatchesAccept(file("song.m4a", ""), "audio/*")).toBe(true);
    expect(fileMatchesAccept(file("song.m4a", ""), "video/*")).toBe(false);
  });
});

describe("classifyDroppedFiles", () => {
  it("separates oversized and wrong-type files from matches", () => {
    const pdf = file("notes.pdf", "application/pdf");
    const png = file("photo.png", "image/png");
    const huge = new File([new Uint8Array(1)], "huge.pdf", { type: "application/pdf" });
    Object.defineProperty(huge, "size", { value: MAX_FILE_BYTES });
    const sorted = classifyDroppedFiles([pdf, png, huge], "application/pdf");
    expect(sorted.matched.map((f) => f.name)).toEqual(["notes.pdf"]);
    expect(sorted.wrongType.map((f) => f.name)).toEqual(["photo.png"]);
    expect(sorted.oversized.map((f) => f.name)).toEqual(["huge.pdf"]);
  });
});
