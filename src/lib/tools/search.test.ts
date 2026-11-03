import { describe, expect, it } from "vitest";
import { searchTools, type SearchDocument } from "./search";
const docs: SearchDocument<string>[] = [
  {
    item: "other",
    id: "other",
    name: "Other",
    keywords: "graph",
    description: "A calculator",
    category: "Math",
  },
  {
    item: "calculator",
    id: "scientific-calculator",
    name: "Calculator",
    keywords: "math",
    description: "Scientific",
    category: "Math",
  },
  {
    item: "pdf",
    id: "pdf-compress",
    name: "Réduire PDF",
    keywords: "compression",
    description: "Small files",
    category: "PDF",
  },
];
describe("ranked catalog search", () => {
  it("ranks names above incidental descriptions", () =>
    expect(searchTools(docs, "calculator")).toEqual(["calculator", "other"]));
  it("normalizes accents, case and punctuation", () =>
    expect(searchTools(docs, "REDUIRE-pdf")[0]).toBe("pdf"));
  it("accepts transposition/insertion/deletion without matching short typos", () => {
    for (const word of ["calcualtor", "calculatr", "calculaator"])
      expect(searchTools(docs, word)[0]).toBe("calculator");
    expect(searchTools(docs, "pfd")).toEqual([]);
  });
  it("understands common intents and requires every token", () => {
    expect(searchTools(docs, "make PDF smaller")).toEqual(["pdf"]);
    expect(searchTools(docs, "calculator banana")).toEqual([]);
    expect(searchTools(docs, " ")).toEqual([]);
  });
  it("retains catalog order for ties", () =>
    expect(searchTools(docs, "Math")).toEqual(["calculator", "other"]));
});
