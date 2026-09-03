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
  return { ...messages, tools: slimTools };
}
