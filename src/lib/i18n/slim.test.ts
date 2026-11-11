import { describe, expect, it } from "vitest";
import { omitHomeGreetingMessages, slimMessagesForShell } from "./slim";
import en from "../../../messages/en.json";

describe("slimMessagesForShell", () => {
  it("keeps card copy and drops tool UI plus everyday-converter", () => {
    const slim = slimMessagesForShell(en) as {
      nav: { home: string };
      tools: Record<string, Record<string, string>>;
    };
    expect(slim.nav.home).toBe(en.nav.home);
    expect(slim.tools["currency-converter"].name).toBe(en.tools["currency-converter"].name);
    expect(slim.tools["currency-converter"].description).toBe(en.tools["currency-converter"].description);
    expect(slim.tools["currency-converter"].keywords).toBe(en.tools["currency-converter"].keywords);
    expect(slim.tools["currency-converter"].limits).toBeUndefined();
    expect(slim.tools["currency-converter"].from).toBeUndefined();
    expect(slim.tools["everyday-converter"]).toBeUndefined();
    expect(Object.keys(slim.tools["pdf-merge"] ?? {})).toEqual(["name", "description", "keywords"]);
    /* A tool's own sentence is resolved on the server and handed to the heading
       as a prop, so it does not ride along in a payload that only needs cards. */
    expect(slim.tools["pdf-merge"].summary).toBeUndefined();
  });
});

describe("omitHomeGreetingMessages", () => {
  it("chrome catalog drops greetings after shell slim", () => {
    const chrome = omitHomeGreetingMessages(slimMessagesForShell(en)) as {
      home: Record<string, unknown>;
      tools: Record<string, Record<string, string>>;
    };
    expect(chrome.home.greeting).toBeUndefined();
    expect(chrome.home.newYearCard).toBeUndefined();
    expect(chrome.tools["pdf-merge"]?.run).toBeUndefined();
    expect((slimMessagesForShell(en) as { home: unknown }).home).toEqual(en.home);
  });

  it("drops greeting trees and keeps home chrome plus full tool UI", () => {
    const slim = omitHomeGreetingMessages(en) as {
      home: Record<string, unknown>;
      tools: { "pdf-merge": { run?: string } };
    };
    expect(slim.home.subtitle).toBe(en.home.subtitle);
    expect(slim.home.featured).toBe(en.home.featured);
    expect(slim.home.greeting).toBeUndefined();
    expect(slim.home.subtitleFacts).toBeUndefined();
    expect(slim.home.subtitleObservance).toBeUndefined();
    expect(slim.home.newYearCard).toBeUndefined();
    expect(slim.tools["pdf-merge"].run).toBe(en.tools["pdf-merge"].run);
  });
});

it("supplies only the active tool and its shared unit dictionary", async () => {
  const { messagesForTool } = await import("./slim");
  const graph = messagesForTool(en, "function-grapher");
  expect(Object.keys(graph.tools!)).toEqual(["function-grapher"]);
  expect(graph.math).toEqual(en.math);
  const units = messagesForTool(en, "length-converter");
  expect(Object.keys(units.tools!)).toEqual(["length-converter", "everyday-converter"]);
  expect(units.how).toBeUndefined();
});

it("keeps handoff destination names without restoring other tools' UI payloads", async () => {
  const { messagesForTool } = await import("./slim");
  const messages = messagesForTool(en, "image-convert");
  const catalog = messages.tools as Record<string, Record<string, string>>;
  expect(catalog["images-to-pdf"]).toEqual({ name: en.tools["images-to-pdf"].name });
  expect(catalog["image-compress"].quality).toBeUndefined();
  expect(catalog["pdf-merge"]).toBeUndefined();
});
