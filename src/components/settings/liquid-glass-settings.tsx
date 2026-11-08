"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Menu, Slider, type SliderProps } from "@onlymoein/liquidglass";
import { useLocale } from "next-intl";
import { localeDir } from "@/lib/i18n/config";
import { useGlassMaterial } from "@/lib/theme/liquid-glass";

export function StyleMenu({ title, glass, classic, liquidGlass, onChange }: {
  title: string;
  glass: string;
  classic: string;
  liquidGlass: boolean;
  onChange: (liquidGlass: boolean) => void;
}) {
  const material = useGlassMaterial();
  const rtl = localeDir(useLocale()) === "rtl";
  const selected = liquidGlass ? glass : classic;

  return (
    <div {...material} className="kit-liquid-control">
      <Menu
        aria-label={title}
        className="kit-liquid-style-menu"
        label={selected}
        align={rtl ? "end" : "start"}
        chevron
        trigger={{ "aria-label": `${title}: ${selected}` }}
        items={[
          { label: glass, checked: liquidGlass, onSelect: () => onChange(true) },
          { label: classic, checked: !liquidGlass, onSelect: () => onChange(false) },
        ]}
      />
    </div>
  );
}

export function StyleTransparency(props: SliderProps) {
  const material = useGlassMaterial();
  // The SDK positions and drags the thumb from the physical left.
  return <div {...material} dir="ltr" className="kit-liquid-control kit-liquid-transparency"><Slider {...props} /></div>;
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
