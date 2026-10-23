"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { ToolShell } from "./shared";
import {
  plainUnicodeText,
  styleUnicodeText,
  unicodeStyles,
  type UnicodeStyle,
} from "@/lib/text/unicode-styles";

export function UnicodeStyles() {
  const t = useTranslations("tools.unicode-styles");
  const tc = useTranslations("common");
  const [text, setText] = useState("");
  return (
    <ToolShell toolId="unicode-styles">
      <Field label={tc("input")}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder={t("placeholder")}
          className="min-h-28 text-base"
        />
      </Field>
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(unicodeStyles) as UnicodeStyle[]).map((style) => {
          const result = styleUnicodeText(text || "Kit 123", style);
          return (
            <section
              key={style}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium">
                  {t(`style${style[0].toUpperCase()}${style.slice(1)}`)}
                </h2>
                <CopyButton
                  value={text ? result : ""}
                  size="sm"
                  aria-label={`${tc("copy")} · ${t(`style${style[0].toUpperCase()}${style.slice(1)}`)}`}
                />
              </div>
              <p className="break-words text-2xl leading-relaxed" dir="auto">
                <span aria-hidden>{result}</span>
                <span className="sr-only">{text || "Kit 123"}</span>
              </p>
            </section>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div>
          <h2 className="text-sm font-medium">{t("plain")}</h2>
          <p className="mt-1 break-words text-muted-foreground" dir="auto">
            {plainUnicodeText(text) || "—"}
          </p>
        </div>
        <CopyButton
          value={plainUnicodeText(text)}
          aria-label={`${tc("copy")} · ${t("plain")}`}
        />
      </div>
    </ToolShell>
  );
}
