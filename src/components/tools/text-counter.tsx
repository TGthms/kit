"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/textarea";
import { formatReadingTime, measureText } from "@/lib/converter/text-counter";
import { ToolLimits, ToolShell, useToolHistory } from "./shared";
import { text, toolId } from "./everyday-format";

export function TextCounter() {
  const t = useTranslations("tools.text-counter");
  const locale = useLocale();
  const log = useToolHistory(toolId("text-counter"));
  const [value, setValue] = useState("");
  const metrics = useMemo(() => measureText(value, { locale }), [locale, value]);
  const metricCards: Array<{ label: string; value?: number; suffix?: string; display?: string }> = [
    { label: text(t, "words", "Words"), value: metrics.words },
    { label: text(t, "characters", "Characters with spaces"), value: metrics.characters },
    { label: text(t, "noSpaces", "Characters without spaces"), value: metrics.charactersNoSpaces },
    { label: text(t, "sentences", "Sentences"), value: metrics.sentences },
    { label: text(t, "paragraphs", "Paragraphs"), value: metrics.paragraphs },
    {
      label: text(t, "readTime", "Reading time"),
      display: formatReadingTime(metrics.readingTimeSeconds),
    },
  ];
  return (
    <ToolShell toolId={toolId("text-counter")}>
      <ToolLimits>
        <p>{text(t, "limits", "Counts use browser-native Unicode segmentation when available. Reading time is about 220 words/min for alphabetic text and 400 characters/min for Chinese, Japanese, and Korean.")}</p>
      </ToolLimits>
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={text(t, "placeholder", "Paste or type text here to see a live reading profile.")} className="min-h-64 text-base" aria-label={text(t, "input", "Text to count")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metricCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              {card.display ? (
                <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{card.display}</p>
              ) : (
                <AnimatedNumber
                  value={card.value ?? 0}
                  suffix={card.suffix}
                  className="mt-2 text-2xl font-semibold tracking-tight"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={value} />
        <Button
          variant="outline"
          onClick={() => {
            log(`${metrics.words} words, ${metrics.characters} characters`, "success");
            notifyHistorySaved(text(t, "saved", "Snapshot saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
          }}
        >
          <Check /> {text(t, "record", "Record snapshot")}
        </Button>
      </div>
    </ToolShell>
  );
}
