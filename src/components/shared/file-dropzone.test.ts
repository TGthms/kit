import { describe, expect, it } from "vitest";
import { fileMatchesAccept } from "@/lib/files/accept";

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
  });

  it("accepts audio and video by extension when MIME is empty", () => {
    expect(fileMatchesAccept(file("clip.mp4", ""), "video/*")).toBe(true);
    expect(fileMatchesAccept(file("song.m4a", ""), "audio/*")).toBe(true);
    expect(fileMatchesAccept(file("song.m4a", ""), "video/*")).toBe(false);
  });
});
