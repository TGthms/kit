"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatUnitSymbol } from "@/lib/converter/units";
import { translateOr } from "@/lib/i18n/translate";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/*
 * The open list is an overlay anchored to its control rather than a block of
 * the page, so opening one moves nothing around it. These are the height the
 * list is happy to use, the least worth showing, and the berth kept from the
 * edge of the window.
 */
const LIST_MAX_HEIGHT = 208;
const LIST_MIN_HEIGHT = 120;
const VIEWPORT_MARGIN = 8;

export function SearchableSelect(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  searchable?: boolean;
  hideLabel?: boolean;
}) {
  return <SearchableSelectField searchable={props.options.length > 4} {...props} />;
}

function SearchableSelectField({
  label,
  value,
  options,
  onChange,
  searchable = options.length > 4,
  hideLabel = false,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  searchable?: boolean;
  hideLabel?: boolean;
}) {
  const t = useTranslations("common");
  const listId = useId();
  const controlId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"below" | "above">("below");
  const [listHeight, setListHeight] = useState(LIST_MAX_HEIGHT);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value);
  const optionText = (option: { value: string; label: string }) =>
    `${formatUnitSymbol(option.value)} — ${option.label}`;
  const selectedLabel = selected ? optionText(selected) : "";
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      `${option.value} ${formatUnitSymbol(option.value)} ${option.label}`.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  /* Which side of the control the list fits on, and how much of it can be
     shown there. Measured as the list opens rather than after it paints, so it
     arrives in its final place instead of jumping to it. */
  const place = useCallback(() => {
    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const above = rect.top - VIEWPORT_MARGIN;
    /* Below the control is the familiar side. Above it is for a control near
       the foot of the window, where the list would otherwise run off it. */
    const flip = below < LIST_MAX_HEIGHT && above > below;
    const room = flip ? above : below;
    setPlacement(flip ? "above" : "below");
    setListHeight(Math.min(LIST_MAX_HEIGHT, Math.max(LIST_MIN_HEIGHT, room)));
  }, []);

  const openList = useCallback(() => {
    place();
    setOpen(true);
  }, [place]);

  useEffect(() => {
    if (!open) return;
    /* A rotated screen or a resized window moves the room the list has. */
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Keyboard navigation must keep the active option visible: with long option
  // lists the highlighted entry otherwise moves out of the scrolled viewport
  // while aria-activedescendant keeps pointing at it. The list is scrolled by
  // its own offset rather than through scrollIntoView, which would carry the
  // page along with it.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !active) return;
    const listBox = list.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    if (activeBox.top < listBox.top) list.scrollTop -= listBox.top - activeBox.top;
    else if (activeBox.bottom > listBox.bottom) list.scrollTop += activeBox.bottom - listBox.bottom;
  }, [open, activeIndex, filtered, listHeight, placement]);

  const labelNode = hideLabel ? (
    <span className="sr-only">{label}</span>
  ) : (
    <Label htmlFor={controlId}>{label}</Label>
  );

  if (!searchable) {
    return (
      <div className="space-y-2">
        {labelNode}
        <select
          id={controlId}
          className={selectClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {optionText(option)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const clampedIndex = filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);
  const active = filtered[clampedIndex];
  const activeId = active ? `${listId}-opt-${active.value}` : undefined;

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(index: number) {
    const option = filtered[index];
    if (!option) return;
    onChange(option.value);
    close();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openList();
        setQuery("");
        return;
      }
      if (!filtered.length) return;
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        setQuery("");
        return;
      }
      if (!filtered.length) return;
      setActiveIndex((index) => (index - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && open) {
      event.preventDefault();
      if (filtered.length) setActiveIndex(filtered.length - 1);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      choose(clampedIndex);
    }
  }

  const popoverStyle: CSSProperties & Record<string, string | number> = {
    maxHeight: listHeight,
    /* The list travels out of its control, which is upwards when it opens above. */
    "--popover-from": placement === "above" ? "4px" : "-4px",
  };

  return (
    <div className="space-y-2" ref={rootRef}>
      {labelNode}
      <div className="relative" ref={controlRef}>
        <Input
          id={controlId}
          value={open ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) openList();
            setActiveIndex(0);
          }}
          onFocus={() => {
            const selectedIdx = options.findIndex((option) => option.value === value);
            setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
            openList();
            setQuery("");
          }}
          onKeyDown={onInputKeyDown}
          placeholder={selectedLabel || translateOr(t, "search", "Search")}
          className="pe-9 text-base"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open ? activeId : undefined}
          aria-label={label}
          autoComplete="off"
        />
        <ChevronsUpDown className="pointer-events-none absolute end-3 top-3 h-4 w-4 text-muted-foreground" />
        {open ? (
          <div
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={translateOr(t, "searchResults", `${label} search results`, { label })}
            style={popoverStyle}
            className={cn(
              "anim-popover surface-float-lg absolute inset-x-0 z-30 overflow-y-auto rounded-xl border border-input bg-background p-1",
              placement === "below" ? "top-full mt-1" : "bottom-full mb-1"
            )}
          >
            {filtered.length ? (
              filtered.map((option, index) => (
                <button
                  key={option.value}
                  id={`${listId}-opt-${option.value}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.value === value}
                  data-active={index === clampedIndex ? "true" : undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className="flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-primary/10 aria-selected:font-medium data-[active=true]:bg-secondary"
                >
                  <span className="truncate">{optionText(option)}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-muted-foreground">{translateOr(t, "noMatches", "No matches")}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
