import fs from "fs";
import path from "path";
import type { Locale } from "@/lib/i18n/config";

export function loadLegal(locale: Locale, doc: "privacy" | "terms"): string {
  const file = path.join(process.cwd(), "content", "legal", locale, `${doc}.md`);
  return fs.readFileSync(file, "utf8");
}

export function renderSimpleMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1 class="text-3xl font-semibold tracking-tight mb-4">${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2 class="text-xl font-semibold mt-8 mb-3">${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3 class="text-lg font-semibold mt-6 mb-2">${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push('<ul class="list-disc pl-5 space-y-1 my-3">');
        inList = true;
      }
      html.push(`<li class="text-sm leading-relaxed text-muted-foreground">${inline(line.slice(2))}</li>`);
      continue;
    }
    closeList();
    html.push(`<p class="text-sm leading-relaxed text-muted-foreground my-3">${inline(line)}</p>`);
  }
  closeList();
  return html.join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string) {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong class=\"text-foreground font-semibold\">$1</strong>");
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a class="text-primary underline-offset-4 hover:underline" href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return out;
}
