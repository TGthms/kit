"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUnitSymbol } from "@/lib/converter/units";
import { translateOr } from "@/lib/i18n/translate";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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
        setOpen(true);
        setQuery("");
        return;
      }
      if (!filtered.length) return;
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
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

  return (
    <div className="space-y-2" ref={rootRef}>
      {labelNode}
      <div className="relative">
        <Input
          id={controlId}
          value={open ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            const selectedIdx = options.findIndex((option) => option.value === value);
            setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={onInputKeyDown}
          placeholder={selectedLabel || translateOr(t, "search", "Search")}
          className="pe-9 text-base"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? activeId : undefined}
          aria-label={label}
          autoComplete="off"
        />
        <ChevronsUpDown className="pointer-events-none absolute end-3 top-3 h-4 w-4 text-muted-foreground" />
      </div>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={translateOr(t, "searchResults", `${label} search results`, { label })}
          className="max-h-52 overflow-y-auto rounded-xl border border-input bg-background p-1 shadow-sm"
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
  );
}
