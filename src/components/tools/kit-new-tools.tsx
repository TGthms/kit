"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { applyPercentChange, changePercent, percentOf, whatPercent } from "@/lib/converter/percentage";
import { amortizationTotal, compoundAmount, monthlyPayment } from "@/lib/converter/loan";
import { findReplace, sortLines, uniqueLines } from "@/lib/text/lines";
import { sanitizeFilename, slugify } from "@/lib/text/slugify";
import { contrastRatio, parseHex, wcagLevel } from "@/lib/text/contrast";
import { extractPalette, type PaletteColor } from "@/lib/image/palette";
import { missingSide, parseRatio, ratioFromSize } from "@/lib/converter/aspect-ratio";
import { overlapWindows } from "@/lib/converter/meeting";
import { cityTimeZones } from "@/lib/converter/cities";
import { flattenJson, jsonPathGet } from "@/lib/text/json-query";
import { ean13Check, ibanCheck, isbn10Check, isbn13Check } from "@/lib/text/check-digits";
import { ToolShell, useToolHistory } from "./shared";

function formatNum(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "—";
  return Number(value.toPrecision(digits)).toString();
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PercentageCalculator() {
  const t = useTranslations("tools.percentage-calculator");
  const log = useToolHistory("percentage-calculator");
  const [mode, setMode] = useState<"of" | "what" | "change" | "apply">("of");
  const [a, setA] = useState("20");
  const [b, setB] = useState("50");

  const result = useMemo(() => {
    try {
      const x = Number(a);
      const y = Number(b);
      if (mode === "of") return { label: t("resultOf"), value: percentOf(x, y), suffix: "" };
      if (mode === "what") return { label: t("resultWhat"), value: whatPercent(x, y), suffix: "%" };
      if (mode === "change") return { label: t("resultChange"), value: changePercent(x, y), suffix: "%" };
      return { label: t("resultApply"), value: applyPercentChange(x, y), suffix: "" };
    } catch {
      return null;
    }
  }, [a, b, mode, t]);

  return (
    <ToolShell toolId="percentage-calculator">
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "of", label: t("modeOf") },
          { value: "what", label: t("modeWhat") },
          { value: "change", label: t("modeChange") },
          { value: "apply", label: t("modeApply") },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={mode === "of" || mode === "apply" ? t("percent") : mode === "what" ? t("part") : t("from")}>
          <Input type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} />
        </Field>
        <Field label={mode === "of" ? t("whole") : mode === "what" ? t("whole") : mode === "change" ? t("to") : t("changePercent")}>
          <Input type="number" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} />
        </Field>
      </div>
      {result ? (
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{result.label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {formatNum(result.value)}
            {result.suffix}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => {
              log(`${mode}:${formatNum(result.value)}`, "success");
              toast.success(t("saved"));
            }}
          >
            {t("record")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
    </ToolShell>
  );
}

export function LoanCalculator() {
  const t = useTranslations("tools.loan-calculator");
  const log = useToolHistory("loan-calculator");
  const [mode, setMode] = useState<"loan" | "compound">("loan");
  const [principal, setPrincipal] = useState("250000");
  const [rate, setRate] = useState("5.5");
  const [years, setYears] = useState("30");
  const [compounds, setCompounds] = useState("12");

  const result = useMemo(() => {
    try {
      const p = Number(principal);
      const r = Number(rate);
      const y = Number(years);
      if (mode === "loan") {
        const payment = monthlyPayment({ principal: p, annualRatePercent: r, years: y });
        const total = amortizationTotal(payment, y);
        return { payment, total, interest: total - p, future: null as number | null };
      }
      const future = compoundAmount({
        principal: p,
        annualRatePercent: r,
        years: y,
        compoundsPerYear: Number(compounds) || 12,
      });
      return { payment: null as number | null, total: null as number | null, interest: future - p, future };
    } catch {
      return null;
    }
  }, [compounds, mode, principal, rate, years]);

  return (
    <ToolShell toolId="loan-calculator">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "loan", label: t("modeLoan") },
          { value: "compound", label: t("modeCompound") },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("principal")}>
          <Input type="number" min="0" step="any" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </Field>
        <Field label={t("rate")}>
          <Input type="number" min="0" step="any" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label={t("years")}>
          <Input type="number" min="0" step="any" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        {mode === "compound" ? (
          <Field label={t("compounds")}>
            <Input type="number" min="1" step="1" inputMode="numeric" value={compounds} onChange={(e) => setCompounds(e.target.value)} />
          </Field>
        ) : null}
      </div>
      {result ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {mode === "loan" ? (
            <>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("monthly")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.payment!)}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("totalPaid")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.total!)}</p>
              </div>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground">{t("interest")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.interest)}</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:col-span-2">
                <p className="text-xs text-muted-foreground">{t("futureValue")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.future!)}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("interest")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.interest)}</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
      <Button
        variant="outline"
        disabled={!result}
        onClick={() => {
          if (!result) return;
          log(mode === "loan" ? formatMoney(result.payment!) : formatMoney(result.future!), "success");
          toast.success(t("saved"));
        }}
      >
        {t("record")}
      </Button>
    </ToolShell>
  );
}

export function TextLines() {
  const t = useTranslations("tools.text-lines");
  const log = useToolHistory("text-lines");
  const [text, setText] = useState("banana\napple\nbanana\nCherry\n10\n2");
  const [find, setFind] = useState("banana");
  const [replace, setReplace] = useState("orange");
  const [caseInsensitive, setCaseInsensitive] = useState(false);

  const apply = (next: string, summary: string) => {
    setText(next);
    log(summary, "success");
    toast.success(t("success"));
  };

  return (
    <ToolShell toolId="text-lines">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-48 font-mono" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("find")}>
          <Input value={find} onChange={(e) => setFind(e.target.value)} />
        </Field>
        <Field label={t("replace")}>
          <Input value={replace} onChange={(e) => setReplace(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={caseInsensitive} onChange={(e) => setCaseInsensitive(e.target.checked)} className="h-4 w-4 rounded border" />
        {t("caseInsensitive")}
      </label>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => apply(findReplace(text, find, replace, { all: true, caseInsensitive }), "replace")}>{t("runReplace")}</Button>
        <Button variant="outline" onClick={() => apply(sortLines(text), "sort")}>{t("sort")}</Button>
        <Button variant="outline" onClick={() => apply(sortLines(text, { reverse: true }), "sort-desc")}>{t("sortDesc")}</Button>
        <Button variant="outline" onClick={() => apply(sortLines(text, { numeric: true }), "sort-num")}>{t("sortNumeric")}</Button>
        <Button variant="outline" onClick={() => apply(uniqueLines(text, { keepOrder: true }), "unique")}>{t("unique")}</Button>
        <CopyButton value={text} disabled={!text} />
      </div>
    </ToolShell>
  );
}

export function SlugifyTool() {
  const t = useTranslations("tools.slugify");
  const log = useToolHistory("slugify");
  const [input, setInput] = useState("Hello, World! Café déjà vu");
  const slug = useMemo(() => slugify(input), [input]);
  const filename = useMemo(() => sanitizeFilename(input), [input]);

  return (
    <ToolShell toolId="slugify">
      <Field label={t("input")}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <div className="space-y-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("slug")}</p>
          <p className="mt-1 break-all font-mono text-lg">{slug || "—"}</p>
          <div className="mt-2 flex gap-2">
            <CopyButton value={slug} disabled={!slug} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                log(slug || "(empty)", "success");
                toast.success(t("saved"));
              }}
            >
              {t("record")}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{t("filename")}</p>
          <p className="mt-1 break-all font-mono text-lg">{filename}</p>
          <CopyButton className="mt-2" value={filename} />
        </div>
      </div>
    </ToolShell>
  );
}

export function ColorContrast() {
  const t = useTranslations("tools.color-contrast");
  const log = useToolHistory("color-contrast");
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#ffffff");

  const result = useMemo(() => {
    try {
      parseHex(fg);
      parseHex(bg);
      const ratio = contrastRatio(fg, bg);
      return { ratio, level: wcagLevel(ratio) };
    } catch {
      return null;
    }
  }, [bg, fg]);

  return (
    <ToolShell toolId="color-contrast">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Field label={t("foreground")}>
            <Input id="contrast-fg" value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" />
          </Field>
          <input
            type="color"
            aria-label={t("foreground")}
            className="h-10 w-12 cursor-pointer rounded-xl border bg-background"
            value={/^#[0-9a-fA-F]{6}$/.test(fg) ? fg : "#000000"}
            onChange={(e) => setFg(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Field label={t("background")}>
            <Input id="contrast-bg" value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" />
          </Field>
          <input
            type="color"
            aria-label={t("background")}
            className="h-10 w-12 cursor-pointer rounded-xl border bg-background"
            value={/^#[0-9a-fA-F]{6}$/.test(bg) ? bg : "#ffffff"}
            onChange={(e) => setBg(e.target.value)}
          />
        </div>
      </div>
      {result ? (
        <>
          <div
            className="rounded-2xl border p-6 text-center text-lg font-medium"
            style={{ color: fg, backgroundColor: bg }}
          >
            {t("preview")}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("ratio")}</p>
              <p className="mt-1 font-mono text-2xl font-semibold">{formatNum(result.ratio, 4)}:1</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("wcag")}</p>
              <p className="mt-1 text-2xl font-semibold">
                {result.level === "fail" ? t("fail") : result.level}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              log(`${formatNum(result.ratio, 3)}:${result.level}`, "success");
              toast.success(t("saved"));
            }}
          >
            {t("record")}
          </Button>
        </>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
    </ToolShell>
  );
}

export function ImagePalette() {
  const t = useTranslations("tools.image-palette");
  const tc = useTranslations("common");
  const log = useToolHistory("image-palette");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [colors, setColors] = useState<PaletteColor[]>([]);
  const [maxColors, setMaxColors] = useState("6");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) {
      toast.error(t("needImage"));
      return;
    }
    setLoading(true);
    try {
      const bmp = await createImageBitmap(files[0].file);
      const maxSide = 256;
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const width = Math.max(1, Math.round(bmp.width * scale));
      const height = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(tc("error"));
      ctx.drawImage(bmp, 0, 0, width, height);
      bmp.close();
      const imageData = ctx.getImageData(0, 0, width, height);
      const palette = extractPalette(imageData, { maxColors: Number(maxColors) || 6 });
      setColors(palette);
      log(`${palette.length} colors`, "success");
      toast.success(t("success"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-palette">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <FileDropzone accept="image/*" multiple={false} files={files} onChange={setFiles} />
      <Field label={t("maxColors")}>
        <Input type="number" min={1} max={24} value={maxColors} onChange={(e) => setMaxColors(e.target.value)} />
      </Field>
      <Button onClick={run} disabled={loading || !files[0]}>
        {loading ? tc("processing") : t("run")}
      </Button>
      {colors.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {colors.map((c) => (
            <li key={c.hex} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <span className="h-10 w-10 shrink-0 rounded-xl border" style={{ backgroundColor: c.hex }} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{c.hex}</p>
                <p className="text-xs text-muted-foreground">{t("pixels", { count: c.count })}</p>
              </div>
              <CopyButton value={c.hex} size="sm" />
            </li>
          ))}
        </ul>
      ) : null}
    </ToolShell>
  );
}

export function AspectRatioTool() {
  const t = useTranslations("tools.aspect-ratio");
  const log = useToolHistory("aspect-ratio");
  const [mode, setMode] = useState<"fromSize" | "missing">("fromSize");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [ratioText, setRatioText] = useState("16:9");
  const [known, setKnown] = useState<"width" | "height">("width");
  const [knownValue, setKnownValue] = useState("1920");

  const fromSize = useMemo(() => {
    try {
      return ratioFromSize(Number(width), Number(height));
    } catch {
      return null;
    }
  }, [height, width]);

  const missing = useMemo(() => {
    try {
      const ratio = parseRatio(ratioText);
      return missingSide({
        ratioW: ratio.w,
        ratioH: ratio.h,
        ...(known === "width" ? { width: Number(knownValue) } : { height: Number(knownValue) }),
      });
    } catch {
      return null;
    }
  }, [known, knownValue, ratioText]);

  return (
    <ToolShell toolId="aspect-ratio">
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "fromSize", label: t("modeFromSize") },
          { value: "missing", label: t("modeMissing") },
        ]}
      />
      {mode === "fromSize" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("width")}>
              <Input type="number" min="0" step="any" value={width} onChange={(e) => setWidth(e.target.value)} />
            </Field>
            <Field label={t("height")}>
              <Input type="number" min="0" step="any" value={height} onChange={(e) => setHeight(e.target.value)} />
            </Field>
          </div>
          {fromSize ? (
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("ratio")}</p>
              <p className="mt-1 font-mono text-2xl font-semibold">
                {fromSize.w}:{fromSize.h}
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => {
                  log(`${fromSize.w}:${fromSize.h}`, "success");
                  toast.success(t("saved"));
                }}
              >
                {t("record")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-destructive">{t("invalid")}</p>
          )}
        </>
      ) : (
        <>
          <Field label={t("ratioInput")}>
            <Input value={ratioText} onChange={(e) => setRatioText(e.target.value)} placeholder="16:9" className="font-mono" />
          </Field>
          <SegmentedControl
            value={known}
            aria-label={t("knownSide")}
            onChange={setKnown}
            options={[
              { value: "width", label: t("width") },
              { value: "height", label: t("height") },
            ]}
          />
          <Field label={known === "width" ? t("width") : t("height")}>
            <Input type="number" min="0" step="any" value={knownValue} onChange={(e) => setKnownValue(e.target.value)} />
          </Field>
          {missing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("width")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatNum(missing.width)}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("height")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatNum(missing.height)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">{t("invalid")}</p>
          )}
        </>
      )}
    </ToolShell>
  );
}

export function MeetingPlanner() {
  const t = useTranslations("tools.meeting-planner");
  const log = useToolHistory("meeting-planner");
  const zoneOptions = useMemo(
    () => cityTimeZones().map((value) => ({ value, label: value.replaceAll("_", " ") })),
    []
  );
  const [date, setDate] = useState(todayIso);
  const [zones, setZones] = useState<string[]>(["America/Los_Angeles", "Europe/London"]);
  const [workStart, setWorkStart] = useState("9");
  const [workEnd, setWorkEnd] = useState("17");
  const [utcStart, setUtcStart] = useState("0");
  const [utcEnd, setUtcEnd] = useState("23");

  const windows = useMemo(() => {
    try {
      return overlapWindows({
        zones,
        date,
        startHour: Number(utcStart),
        endHour: Number(utcEnd),
        workStart: Number(workStart),
        workEnd: Number(workEnd),
      });
    } catch {
      return null;
    }
  }, [date, utcEnd, utcStart, workEnd, workStart, zones]);

  const setZoneAt = (index: number, value: string) => {
    setZones((prev) => prev.map((z, i) => (i === index ? value : z)));
  };

  return (
    <ToolShell toolId="meeting-planner">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <Field label={t("date")}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="space-y-3">
        {zones.map((zone, index) => (
          <div key={`${index}-${zone}`} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <SearchableSelect
                label={t("zone", { number: index + 1 })}
                value={zone}
                options={zoneOptions}
                onChange={(value) => setZoneAt(index, value)}
              />
            </div>
            {zones.length > 2 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("removeZone")}
                onClick={() => setZones((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setZones((prev) => [...prev, "Asia/Tokyo"])} disabled={zones.length >= 6}>
          <Plus className="h-4 w-4" /> {t("addZone")}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("workStart")}>
          <Input type="number" min={0} max={23} value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
        </Field>
        <Field label={t("workEnd")}>
          <Input type="number" min={1} max={24} value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
        </Field>
        <Field label={t("utcStart")}>
          <Input type="number" min={0} max={23} value={utcStart} onChange={(e) => setUtcStart(e.target.value)} />
        </Field>
        <Field label={t("utcEnd")}>
          <Input type="number" min={0} max={23} value={utcEnd} onChange={(e) => setUtcEnd(e.target.value)} />
        </Field>
      </div>
      {windows === null ? (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      ) : windows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      ) : (
        <ul className="space-y-2">
          {windows.map((w) => (
            <li key={w.utcIso} className="rounded-2xl border bg-card p-3 text-sm">
              <p className="font-medium">
                {t("utcHour", { hour: String(w.utcHour).padStart(2, "0") })}
              </p>
              <p className="mt-1 text-muted-foreground">
                {zones.map((z) => `${z.split("/").pop()?.replaceAll("_", " ")} ${String(w.localHours[z]).padStart(2, "0")}:00`).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        disabled={!windows || windows.length === 0}
        onClick={() => {
          if (!windows?.length) return;
          log(`${windows.length} windows`, "success");
          toast.success(t("saved"));
        }}
      >
        {t("record")}
      </Button>
    </ToolShell>
  );
}

export function JsonQuery() {
  const t = useTranslations("tools.json-query");
  const log = useToolHistory("json-query");
  const [input, setInput] = useState('{\n  "user": { "name": "Kit", "tags": ["pdf", "image"] },\n  "count": 2\n}');
  const [path, setPath] = useState("$.user.tags[0]");
  const [mode, setMode] = useState<"path" | "flatten">("path");
  const [out, setOut] = useState("");
  const [error, setError] = useState("");

  const run = () => {
    try {
      const data = JSON.parse(input) as unknown;
      if (mode === "flatten") {
        const flat = flattenJson(data);
        const text = Object.entries(flat)
          .map(([k, v]) => `${k || "(root)"} = ${JSON.stringify(v)}`)
          .join("\n");
        setOut(text);
        setError("");
        log("flatten", "success");
        toast.success(t("success"));
        return;
      }
      const values = jsonPathGet(data, path);
      setOut(JSON.stringify(values, null, 2));
      setError("");
      log(path, "success");
      toast.success(t("success"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("invalid"));
      setOut("");
      log("failed", "failed");
    }
  };

  return (
    <ToolShell toolId="json-query">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "path", label: t("modePath") },
          { value: "flatten", label: t("modeFlatten") },
        ]}
      />
      <Field label={t("json")}>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-40 font-mono" />
      </Field>
      {mode === "path" ? (
        <Field label={t("path")}>
          <Input value={path} onChange={(e) => setPath(e.target.value)} className="font-mono" placeholder="$.user.name" />
        </Field>
      ) : null}
      <div className="flex gap-2">
        <Button onClick={run}>{t("run")}</Button>
        <CopyButton value={out} disabled={!out} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {out ? <Textarea value={out} readOnly className="min-h-32 font-mono" /> : null}
    </ToolShell>
  );
}

export function CheckDigits() {
  const t = useTranslations("tools.check-digits");
  const log = useToolHistory("check-digits");
  const [kind, setKind] = useState<"isbn13" | "isbn10" | "ean13" | "iban">("isbn13");
  const [value, setValue] = useState("9780306406157");

  const result = useMemo(() => {
    if (kind === "isbn13") return isbn13Check(value);
    if (kind === "isbn10") return isbn10Check(value);
    if (kind === "ean13") return ean13Check(value);
    return ibanCheck(value);
  }, [kind, value]);

  return (
    <ToolShell toolId="check-digits">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <SegmentedControl
        value={kind}
        aria-label={t("kind")}
        onChange={setKind}
        options={[
          { value: "isbn13", label: "ISBN-13" },
          { value: "isbn10", label: "ISBN-10" },
          { value: "ean13", label: "EAN-13" },
          { value: "iban", label: "IBAN" },
        ]}
      />
      <Field label={t("value")}>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
      </Field>
      <div className={`rounded-2xl border p-4 ${result.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"}`}>
        <p className="text-lg font-semibold">{result.ok ? t("valid") : t("invalid")}</p>
        {result.normalized ? (
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {t("normalized")}: {result.normalized}
          </p>
        ) : null}
      </div>
      <Button
        variant="outline"
        onClick={() => {
          log(`${kind}:${result.ok ? "ok" : "fail"}`, result.ok ? "success" : "failed");
          toast.success(t("saved"));
        }}
      >
        {t("record")}
      </Button>
    </ToolShell>
  );
}
