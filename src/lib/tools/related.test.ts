import { describe, expect, it } from "vitest";
import { getTool, tools } from "./registry";
import { RELATED_LIMIT, relatedTools } from "./related";

describe("the tools a page offers next", () => {
  it("stays inside the tool's own section of the catalogue", () => {
    for (const tool of tools) {
      for (const id of relatedTools(tool.id)) {
        expect(getTool(id)?.category, `${tool.id} -> ${id}`).toBe(tool.category);
      }
    }
  });

  it("never offers the page it is on", () => {
    for (const tool of tools) {
      expect(relatedTools(tool.id), tool.id).not.toContain(tool.id);
    }
  });

  it("stays short enough to read", () => {
    for (const tool of tools) {
      const related = relatedTools(tool.id);
      expect(related.length, tool.id).toBeLessThanOrEqual(RELATED_LIMIT);
      /* Every section has more than one tool, so a page always has somewhere
         to go next. */
      expect(related.length, tool.id).toBeGreaterThan(0);
      expect(new Set(related).size, tool.id).toBe(related.length);
    }
  });

  it("offers every tool in a section from somewhere, rather than the first few from everywhere", () => {
    const offered = new Set(tools.flatMap((tool) => relatedTools(tool.id)));
    for (const tool of tools) {
      /* A section of one would leave that tool unoffered, which is correct. */
      const section = tools.filter((entry) => entry.category === tool.category);
      if (section.length < 2) continue;
      expect(offered.has(tool.id), `${tool.id} is never offered`).toBe(true);
    }
  });

  it("answers the same way every time, so a rebuild changes nothing", () => {
    for (const tool of tools) {
      expect(relatedTools(tool.id), tool.id).toEqual(relatedTools(tool.id));
    }
  });

  it("offers nothing for a tool that does not exist, or for no room at all", () => {
    expect(relatedTools("not-a-tool" as Parameters<typeof relatedTools>[0])).toEqual([]);
    expect(relatedTools("pdf-merge", 0)).toEqual([]);
  });
});
