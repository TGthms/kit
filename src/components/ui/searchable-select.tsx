"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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
    const onKey = (event: KeyboardEvent) => {
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

  const labelNode = hideLabel ? <span className="sr-only">{label}</span> : <Label>{label}</Label>;

  if (!searchable) {
    return (
      <div className="space-y-2">
        {labelNode}
        <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {optionText(option)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      {labelNode}
      <div className="relative">
        <Input
          value={open ? query : selectedLabel}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          placeholder={selectedLabel || translateOr(t, "search", "Search")}
          className="pe-9 text-base"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
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
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-primary/10 aria-selected:font-medium"
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
