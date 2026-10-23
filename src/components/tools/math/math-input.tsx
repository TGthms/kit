"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type DetailedHTMLProps,
  type HTMLAttributes,
} from "react";
import type { MathfieldElement } from "mathlive";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- React custom-element type augmentation.
  namespace JSX {
    interface IntrinsicElements {
      "math-field": DetailedHTMLProps<
        HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}

let loading: Promise<typeof import("mathlive")> | undefined;
function loadMathfield() {
  return (loading ??= import("mathlive")
    .then((module) => {
      module.MathfieldElement.fontsDirectory = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/vendor/math/fonts`;
      module.MathfieldElement.soundsDirectory = null;
      module.MathfieldElement.computeEngine = null;
      return module;
    })
    .catch((error) => {
      loading = undefined;
      throw error;
    }));
}

export function MathInput({
  value,
  onChange,
  label,
  onCommit,
  inputRef,
  readOnly = false,
  id,
}: {
  value: string;
  onChange?: (value: string) => void;
  label: string;
  onCommit?: () => void;
  inputRef?: React.RefObject<MathfieldElement | null>;
  readOnly?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const ref = useRef<MathfieldElement | null>(null);
  const [ready, setReady] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [failed, setFailed] = useState(false);
  const locale = useLocale();
  const t = useTranslations("math");
  const tc = useTranslations("common");
  useEffect(() => {
    let mounted = true;
    loadMathfield()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useLayoutEffect(() => {
    if (!ready || !ref.current) return;
    const field = ref.current;
    field.readOnly = readOnly;
    void loadMathfield().then(({ MathfieldElement }) => {
      MathfieldElement.locale = locale;
    });
    field.mathVirtualKeyboardPolicy = readOnly ? "manual" : "auto";
    field.smartFence = true;
    field.smartSuperscript = true;
    field.inlineShortcuts = {
      ...field.inlineShortcuts,
      sqrt: "\\sqrt{#0}",
      pi: "\\pi",
      theta: "\\theta",
    };
    if (field.value !== value)
      field.setValue(value, { silenceNotifications: true });
    // Deliberately initialize once per mounted editor; later updates below
    // preserve selection and the undo stack while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, readOnly, locale]);
  useLayoutEffect(() => {
    if (ready && ref.current && ref.current.value !== value)
      ref.current.setValue(value, { silenceNotifications: true });
  }, [ready, value]);

  return (
    <div className="min-w-0 space-y-2" dir="ltr">
      {!readOnly && (
        <label className="text-sm font-medium" htmlFor={fieldId}>
          {label}
        </label>
      )}
      {ready ? (
        <math-field
          id={fieldId}
          ref={(element) => {
            ref.current = element;
            if (inputRef) inputRef.current = element;
          }}
          aria-label={label}
          aria-describedby={readOnly ? undefined : `${fieldId}-hint`}
          tabIndex={readOnly ? -1 : 0}
          read-only={readOnly ? "" : undefined}
          aria-readonly={readOnly ? "true" : undefined}
          className={readOnly ? "kit-math-result" : "kit-math-input"}
          onPasteCapture={(event) => {
            const plain = event.clipboardData.getData("text/plain");
            const markup =
              event.clipboardData.getData("application/x-latex") ||
              event.clipboardData.getData("text/latex") ||
              event.clipboardData.getData("application/mathml+xml");
            if (plain.length > 512 || markup.length > 4096) {
              event.preventDefault();
              event.stopPropagation();
              setRejected(true);
            }
          }}
          onInput={(event) => {
            setRejected(false);
            onChange?.(event.currentTarget.value);
          }}
          onKeyDownCapture={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              onCommit?.();
            }
          }}
        />
      ) : failed ? (
        <div className="rounded-xl border p-3 text-sm" role="alert">
          {t("errors.unavailable")}{" "}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFailed(false);
              loadMathfield()
                .then(() => setReady(true))
                .catch(() => setFailed(true));
            }}
          >
            {tc("retry")}
          </Button>
        </div>
      ) : (
        <div
          className="flex min-h-16 items-center gap-2 rounded-xl border px-4 text-sm text-muted-foreground"
          role="status"
        >
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          {tc("loading")}
        </div>
      )}
      {rejected && (
        <p role="alert" className="text-xs text-destructive">
          {t("errors.invalid")}
        </p>
      )}
      {!readOnly && (
        <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
          {t("inputHint")}
        </p>
      )}
    </div>
  );
}

export function MathResult({ latex, label }: { latex: string; label: string }) {
  return <MathInput value={latex} label={label} readOnly />;
}
