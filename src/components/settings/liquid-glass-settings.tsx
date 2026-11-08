"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Menu } from "@onlymoein/liquidglass";
import { useGlassMaterial } from "@/lib/theme/liquid-glass";

export function StyleMenu({ title, glass, classic, onMount, onClassic }: {
  title: string;
  glass: string;
  classic: string;
  onMount: (trigger: HTMLButtonElement | null) => void;
  onClassic: () => void;
}) {
  const material = useGlassMaterial();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    onMount(root.current?.querySelector("button") ?? null);
  }, [onMount]);

  return (
    <div {...material} ref={root} className="kit-liquid-control">
      <Menu
        aria-label={title}
        className="kit-liquid-style-menu"
        label={glass}
        align="start"
        chevron
        trigger={{ "aria-label": `${title}: ${glass}` }}
        items={[
          { label: glass, checked: true },
          { label: classic, checked: false, onSelect: onClassic },
        ]}
      />
    </div>
  );
}

export function GlassClearHistory({ title, description, cancelLabel, onConfirm }: {
  title: string;
  description: string;
  cancelLabel: string;
  onConfirm: () => void;
}) {
  const material = useGlassMaterial();
  const root = useRef<HTMLDivElement>(null);
  const confirmed = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = root.current?.querySelector("dialog");
    if (!dialog) return;
    dialog.setAttribute("role", "alertdialog");
    // The SDK opens the native modal after rendering its actions. Wait for
    // the actual open attribute, then give the least destructive action focus.
    const observer = new MutationObserver(() => {
      if (dialog.open) dialog.querySelector("button")?.focus({ preventScroll: true });
    });
    observer.observe(dialog, { attributeFilter: ["open"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div {...material} ref={root} className="kit-liquid-control kit-liquid-history">
      <Button
        destructive
        data-haptic-important
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          confirmed.current = false;
          setOpen(true);
        }}
      >
        {title}
      </Button>
      <Alert
        open={open}
        onOpenChange={setOpen}
        title={title}
        message={description}
        actions={[
          { label: cancelLabel, role: "cancel" },
          { label: title, role: "destructive", onSelect: () => {
            if (!open || confirmed.current) return;
            confirmed.current = true;
            onConfirm();
          } },
        ]}
      />
    </div>
  );
}
