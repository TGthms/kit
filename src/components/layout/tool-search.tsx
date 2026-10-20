"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { tools } from "@/lib/tools/registry";
import { toolHref } from "@/lib/navigation/routes";
import { OPEN_TOOL_SEARCH_EVENT } from "@/lib/navigation/search";
import { Input } from "@/components/ui/input";

/** Native dialog supplies focus containment, inert background, and Escape. */
export function ToolSearch() {
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const tt = useTranslations("tools");
  const categories = useTranslations("categories");
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");

  const close = () => {
    dialog.current?.close();
    if (opener.current?.isConnected) opener.current.focus();
  };

  useEffect(() => {
    const open = () => {
      if (dialog.current?.open) return;
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setQuery("");
      dialog.current?.showModal();
      input.current?.focus();
    };
    window.addEventListener(OPEN_TOOL_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_TOOL_SEARCH_EVENT, open);
  }, []);

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  const normalized = query.trim().toLocaleLowerCase();
  const results = tools.filter((tool) => [tool.id, tt(`${tool.id}.name`), tt(`${tool.id}.description`), tt(`${tool.id}.keywords`), categories(tool.category)].some((text) => text.toLocaleLowerCase().includes(normalized)));

  return <dialog ref={dialog} aria-labelledby="kit-tool-search-title" className="kit-search-dialog w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl" onCancel={() => { if (opener.current?.isConnected) opener.current.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }} onKeyDown={(event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && !(event.key === "Enter" && event.target === input.current)) return;
    const links = Array.from(dialog.current?.querySelectorAll<HTMLAnchorElement>("a[data-search-result]") ?? []);
    if (!links.length) return;
    event.preventDefault();
    if (event.key === "Enter") { links[0].click(); return; }
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    if (next < 0) input.current?.focus();
    else links[Math.min(next, links.length - 1)]?.focus();
  }}>
    <div className="flex items-center gap-3 border-b border-border p-4">
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <h2 id="kit-tool-search-title" className="sr-only">{tn("searchPlaceholder")}</h2>
      <Input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tn("searchPlaceholder")} aria-label={tn("searchPlaceholder")} autoComplete="off" className="min-w-0 flex-1" />
      <button type="button" onClick={close} aria-label={tc("close")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-secondary"><X className="h-5 w-5" aria-hidden /></button>
    </div>
    <div className="max-h-[min(60dvh,32rem)] overflow-y-auto overscroll-contain p-2">
      {results.length ? <ul aria-label={tc("searchResults", { label: tn("tools") })}>{results.map((tool) => {
        const Icon = tool.icon;
        return <li key={tool.id}><Link href={toolHref(tool.id, pathname)} prefetch={false} data-search-result onClick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) close(); }} className="flex items-center gap-3 rounded-xl p-3 hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-offset-[-2px]">
          <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0"><span className="block text-sm font-medium">{tt(`${tool.id}.name`)}</span><span className="block text-xs text-muted-foreground">{categories(tool.category)}</span></span>
        </Link></li>;
      })}</ul> : <p role="status" className="p-4 text-sm text-muted-foreground">{tc("noMatches")}</p>}
    </div>
  </dialog>;
}
