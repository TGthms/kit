import type { ToolId } from "@/lib/tools/registry";

export type GreetingInlineLink =
  | { tag: "tool"; toolId: ToolId }
  | { tag: "page"; href: "/how" };

/** Subtitle keys that wrap a phrase in `<tool>` or `<page>` for next-intl rich text. */
export const GREETING_SUBTITLE_LINKS: Record<string, GreetingInlineLink> = {
  "subtitleObservance.passwordDay2": { tag: "tool", toolId: "password-generator" },
  "subtitleObservance.passwordDay3": { tag: "tool", toolId: "password-generator" },
  "subtitleObservance.encryptionDay2": { tag: "tool", toolId: "password-generator" },
  "subtitleObservance.dataPrivacyDay": { tag: "page", href: "/how" },
  "subtitleObservance.dataPrivacyDay2": { tag: "page", href: "/how" },
  "subtitleObservance.dataPrivacyDay3": { tag: "page", href: "/how" },
  "subtitleObservance.saferInternetDay2": { tag: "page", href: "/how" },
  "subtitleObservance.saferInternetDay3": { tag: "page", href: "/how" },
  "subtitleObservance.computerSecurityDay2": { tag: "page", href: "/how" },
  "subtitleObservance.computerSecurityDay3": { tag: "page", href: "/how" },
  "subtitleFacts.kit1": { tag: "page", href: "/how" },
  "subtitleFacts.kit3": { tag: "page", href: "/how" },
  "subtitleFacts.kit6": { tag: "page", href: "/how" },
  "subtitleFacts.fact2": { tag: "page", href: "/how" },
  "subtitleFacts.fact6": { tag: "page", href: "/how" },
};

export function greetingInlineLink(subtitleKey: string): GreetingInlineLink | undefined {
  return GREETING_SUBTITLE_LINKS[subtitleKey];
}

export function richTagsIn(value: string): string[] {
  return [...value.matchAll(/<\/?(?:tool|page)>/g)].map((match) => match[0]);
}
