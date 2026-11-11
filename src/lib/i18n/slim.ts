import type { AbstractIntlMessages } from "next-intl";
import { tools } from "@/lib/tools/registry";

const CARD_KEYS = new Set(["name", "description", "keywords"]);

/**
 * Home, settings, and other chrome pages only need tool cards.
 * Drop per-tool UI copy (and the everyday-converter unit dictionary)
 * so the client provider is not carrying every tool’s strings.
 */
export function slimMessagesForShell(messages: AbstractIntlMessages): AbstractIntlMessages {
  const toolsIn = (messages as { tools?: Record<string, unknown> }).tools;
  if (!toolsIn || typeof toolsIn !== "object") return messages;
  const ids = new Set(tools.map((tool) => tool.id));
  const slimTools: Record<string, Record<string, string>> = {};
  for (const [id, entry] of Object.entries(toolsIn)) {
    if (!ids.has(id as (typeof tools)[number]["id"])) continue;
    if (!entry || typeof entry !== "object") continue;
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
      if (CARD_KEYS.has(key) && typeof value === "string") next[key] = value;
    }
    slimTools[id] = next;
  }
  const { how: _how, math: _math, ...shell } = messages;
  void _how; void _math;
  return { ...shell, tools: slimTools };
}

const GREETING_HOME_KEYS = new Set(["greeting", "subtitleFacts", "subtitleObservance", "newYearCard"]);

/** Tool routes do not render home greetings; drop those trees from the client catalog. */
export function omitHomeGreetingMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const home = (messages as { home?: Record<string, unknown> }).home;
  if (!home || typeof home !== "object") return messages;
  const nextHome: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(home)) {
    if (!GREETING_HOME_KEYS.has(key)) nextHome[key] = value;
  }
  return { ...messages, home: nextHome as AbstractIntlMessages };
}

/** Tool UI copy is scoped to its route. The surrounding chrome already owns
 * the search/card catalog, so duplicating all 100 tools here serves no purpose. */
export function messagesForTool(messages: AbstractIntlMessages, toolId: string): AbstractIntlMessages {
  const catalog = messages.tools as AbstractIntlMessages;
  const selected: AbstractIntlMessages = { [toolId]: catalog[toolId] };
  const category = tools.find(tool => tool.id === toolId)?.category;
  if (category === "image" || toolId === "convert-hub") {
    for (const target of ["image-compress", "image-convert", "images-to-pdf"]) {
      if (target !== toolId) selected[target] = { name: (catalog[target] as AbstractIntlMessages).name };
    }
  }
  if (toolId.endsWith("-converter")) selected["everyday-converter"] = catalog["everyday-converter"];
  return Object.fromEntries([
    ...["common", "categories", "history", "workspace", "math", "toolPage"].map(key => [key, messages[key]]),
    ["tools", selected],
  ].filter(([, value]) => value !== undefined)) as AbstractIntlMessages;
}

/** Chrome needs search cards and update notices, not every Settings explanation
 * or tool/workspace message on every one of the 3,000 translated tool routes. */
export function messagesForChrome(messages: AbstractIntlMessages): AbstractIntlMessages {
  const slim = slimMessagesForShell(messages);
  const keep = ["brand", "common", "nav", "categories", "tools", "footer", "shortcuts", "favorites", "history"];
  const settings = messages.settings as AbstractIntlMessages;
  const settingsKeys = ["title", "offlinePreparing", "offlineApplying", "offlineUnavailable", "reviewUpdate", "updateAvailable", "viewHow", "viewPrivacy", "viewTerms"];
  return { ...Object.fromEntries(keep.map(key => [key, slim[key]])), home: { categories: (messages.home as AbstractIntlMessages).categories }, settings: Object.fromEntries(settingsKeys.map(key => [key, settings[key]])) };
}
