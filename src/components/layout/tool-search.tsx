"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { tools } from "@/lib/tools/registry";
import { toolHref } from "@/lib/navigation/routes";
import { OPEN_TOOL_SEARCH_EVENT } from "@/lib/navigation/search";
import { isPlainNavigationClick } from "@/lib/navigation/intent";
import { cn } from "@/lib/utils";

/** An anchored combobox: typing never takes the visitor out of their page. */
export function ToolSearch({ mobile = false }: { mobile?: boolean }) {
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const tt = useTranslations("tools");
  const categories = useTranslations("categories");
  const pathname = usePathname();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const normalized = query.trim().toLocaleLowerCase();
  const results = normalized ? tools.filter((tool) => [tool.id, tt(`${tool.id}.name`), tt(`${tool.id}.description`), tt(`${tool.id}.keywords`), categories(tool.category)].some((text) => text.toLocaleLowerCase().includes(normalized))).slice(0, 8) : [];
  const expanded = open && Boolean(normalized);

  useEffect(() => {
    const show = () => {
      if (window.matchMedia("(max-width: 767px)").matches !== mobile) return;
      setOpen(true);
      if (mobile) requestAnimationFrame(() => input.current?.focus());
      else input.current?.focus();
    };
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener(OPEN_TOOL_SEARCH_EVENT, show);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener(OPEN_TOOL_SEARCH_EVENT, show);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [mobile]);

  useEffect(() => {
    if (active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, id]);

  // Route changes close the dropdown without moving focus back to the old page.
  const [previousPath, setPreviousPath] = useState(pathname);
  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setOpen(false);
    setQuery("");
    setActive(-1);
  }

  return <div ref={root} className={cn(mobile ? "md:hidden" : "relative mb-2 shrink-0")} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    {mobile && <button ref={trigger} type="button" aria-label={tn("searchPlaceholder")} aria-expanded={open} onClick={() => { setOpen(!open); if (!open) requestAnimationFrame(() => input.current?.focus()); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"><Search className="h-[18px] w-[18px]" aria-hidden /></button>}
    <div className={cn(mobile && "absolute inset-x-4 top-full mt-2 rounded-2xl border border-border bg-card p-2 shadow-lg", mobile && !open && "hidden")}>
      <div className="kit-search-field relative flex min-h-11 items-center rounded-xl border border-border/60 bg-background/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="pointer-events-none ms-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input ref={input} type="search" role="combobox" value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setActive(-1); setOpen(true); }} aria-label={tn("searchPlaceholder")} placeholder={tn("searchPlaceholder")} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search" aria-autocomplete="list" aria-expanded={expanded} aria-controls={`${id}-results`} aria-activedescendant={expanded && active >= 0 && results[active] ? `${id}-${active}` : undefined} className="kit-search-input min-w-0 flex-1 bg-transparent px-2 py-2.5 text-base outline-none md:text-sm [&::-webkit-search-cancel-button]:hidden" onKeyDown={(event) => {
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.nativeEvent.isComposing) return;
          if (event.key === "Escape") {
            event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1);
            if (mobile) trigger.current?.focus();
          } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
            event.preventDefault(); setOpen(true);
            setActive((value) => event.key === "ArrowDown" ? Math.min(value + 1, results.length - 1) : value < 0 ? results.length - 1 : Math.max(value - 1, 0));
          } else if (event.key === "Enter" && expanded && results.length) {
            event.preventDefault(); root.current?.querySelector<HTMLAnchorElement>(`[data-result-index="${Math.max(active, 0)}"]`)?.click();
          }
        }} />
        {query ? <button type="button" aria-label={tc("clear")} className="me-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary" onClick={() => { setQuery(""); setActive(-1); input.current?.focus(); }}><X className="h-4 w-4" aria-hidden /></button> : !mobile && <kbd aria-hidden className="me-3 rounded border border-border px-1 text-xs text-muted-foreground">/</kbd>}
      </div>
      {expanded && <div className={cn("z-[70] mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl", !mobile && "absolute start-0 top-full w-[min(22rem,calc(100vw-2rem))]")}>
        <ul id={`${id}-results`} role="listbox" aria-label={tc("searchResults", { label: tn("tools") })} className="max-h-[min(55dvh,28rem)] overflow-y-auto overscroll-contain p-1.5">
          {results.map((tool, index) => {
            const Icon = tool.icon;
            return <li key={tool.id} role="presentation"><Link id={`${id}-${index}`} role="option" aria-selected={active === index} tabIndex={-1} href={toolHref(tool.id, pathname)} prefetch={false} data-result-index={index} onPointerMove={() => setActive(index)} onMouseDown={(event) => { if (event.button === 0) event.preventDefault(); }} onClick={(event) => { if (isPlainNavigationClick(event)) setOpen(false); }} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-start hover:bg-secondary", active === index && "bg-secondary")}>
              <Icon className="h-[18px] w-[18px] shrink-0 text-primary" aria-hidden />
              <span className="min-w-0"><span className="block text-sm font-medium">{tt(`${tool.id}.name`)}</span><span className="block text-xs text-muted-foreground">{categories(tool.category)}</span></span>
            </Link></li>;
          })}
        </ul>
        {!results.length && <p role="status" className="p-4 text-sm text-muted-foreground">{tc("noMatches")}</p>}
      </div>}
    </div>
  </div>;
}
