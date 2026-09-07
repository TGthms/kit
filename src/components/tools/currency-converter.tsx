"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, Check, RefreshCw } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { translateOr } from "@/lib/i18n/translate";
import {
  convertCurrency,
  createCachedRateRecords,
  DEFAULT_RATE_MAX_AGE_MS,
  fetchFrankfurterRates,
  findCachedRate,
  isCachedRateStale,
  type CachedRateRecord,
} from "@/lib/converter/currency";
import { formatConvertedInput } from "@/lib/converter/units";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { useHydrated } from "@/lib/react/hydrated";
import { ToolLimits, ToolShell, useToolHistory } from "./shared";
import { parseLiveNumber, type EditedSide } from "./converter-shared";

const text = translateOr;

const CURRENCIES = [
  ["USD", "US dollar · United States"],
  ["CAD", "Canadian dollar · Canada"],
  ["MXN", "Mexican peso · Mexico"],
  ["BRL", "Brazilian real · Brazil"],
  ["ARS", "Argentine peso · Argentina"],
  ["EUR", "Euro · Europe"],
  ["GBP", "British pound · United Kingdom"],
  ["CHF", "Swiss franc · Switzerland"],
  ["SEK", "Swedish krona · Sweden"],
  ["NOK", "Norwegian krone · Norway"],
  ["DKK", "Danish krone · Denmark"],
  ["PLN", "Polish zloty · Poland"],
  ["CZK", "Czech koruna · Czechia"],
  ["TRY", "Turkish lira · Türkiye"],
  ["JPY", "Japanese yen · Japan"],
  ["CNY", "Chinese yuan · China"],
  ["HKD", "Hong Kong dollar · Hong Kong, China"],
  ["SGD", "Singapore dollar · Singapore"],
  ["KRW", "South Korean won · South Korea"],
  ["INR", "Indian rupee · India"],
  ["THB", "Thai baht · Thailand"],
  ["IDR", "Indonesian rupiah · Indonesia"],
  ["MYR", "Malaysian ringgit · Malaysia"],
  ["PHP", "Philippine peso · Philippines"],
  ["VND", "Vietnamese dong · Vietnam"],
  ["NZD", "New Zealand dollar · New Zealand"],
  ["AED", "UAE dirham · United Arab Emirates"],
  ["SAR", "Saudi riyal · Saudi Arabia"],
  ["ILS", "Israeli new shekel · Israel"],
  ["ZAR", "South African rand · South Africa"],
  ["EGP", "Egyptian pound · Egypt"],
] as const;

const CURRENCY_MESSAGE_KEYS: Record<string, string> = {
  USD: "currencyUsd",
  CAD: "currencyCad",
  MXN: "currencyMxn",
  BRL: "currencyBrl",
  ARS: "currencyArs",
  EUR: "currencyEur",
  GBP: "currencyGbp",
  CHF: "currencyChf",
  SEK: "currencySek",
  NOK: "currencyNok",
  DKK: "currencyDkk",
  PLN: "currencyPln",
  CZK: "currencyCzk",
  TRY: "currencyTry",
  JPY: "currencyJpy",
  CNY: "currencyCny",
  HKD: "currencyHkd",
  SGD: "currencySgd",
  KRW: "currencyKrw",
  INR: "currencyInr",
  THB: "currencyThb",
  IDR: "currencyIdr",
  MYR: "currencyMyr",
  PHP: "currencyPhp",
  VND: "currencyVnd",
  NZD: "currencyNzd",
  AED: "currencyAed",
  SAR: "currencySar",
  ILS: "currencyIls",
  ZAR: "currencyZar",
  EGP: "currencyEgp",
};

const CURRENCY_CACHE_KEY = "kit-everyday-currency-rates-v1";

function readCurrencyCache(): CachedRateRecord[] {
  try {
    const raw = window.localStorage.getItem(CURRENCY_CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((record): record is CachedRateRecord => {
      if (!record || typeof record !== "object") return false;
      const item = record as Record<string, unknown>;
      // The network validator (isRate in currency.ts) requires a positive
      // finite rate; the cache must not accept what the fetch path would
      // reject, or a poisoned cache entry would bypass validation forever.
      return (
        typeof item.date === "string" &&
        typeof item.base === "string" &&
        typeof item.quote === "string" &&
        typeof item.rate === "number" &&
        Number.isFinite(item.rate) &&
        item.rate > 0 &&
        typeof item.fetchedAt === "number"
      );
    });
  } catch {
    return [];
  }
}

function writeCurrencyCache(records: CachedRateRecord[]) {
  try {
    window.localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(records));
  } catch {
    // Quota / private mode. In-memory rates still apply for this session.
  }
}

export function CurrencyConverter({ namespace = "tools.currency-converter" }: { namespace?: "tools.currency-converter" } = {}) {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const log = useToolHistory("currency-converter");
  const [source, setSource] = useState("100");
  const [edited, setEdited] = useState<EditedSide>("from");
  const [base, setBase] = useState("USD");
  const [quote, setQuote] = useState("EUR");
  const hydrated = useHydrated();
  const storedRates = hydrated ? readCurrencyCache() : [];
  const [liveRates, setLiveRates] = useState<CachedRateRecord[] | null>(null);
  const rates = liveRates ?? storedRates;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorFor, setErrorFor] = useState("");
  const pairKey = `${base}:${quote}`;
  const displayError = errorFor === pairKey ? error : "";
  const [refreshToken, setRefreshToken] = useState(0);
  const currencyOptions = useMemo(
    () => CURRENCIES.map(([value, fallback]) => {
      const country = fallback.split(" · ")[1] ?? "";
      let localizedName = text(t, CURRENCY_MESSAGE_KEYS[value] ?? "", fallback);
      let localizedCountry = country;
      try {
        localizedName = new Intl.DisplayNames([locale], { type: "currency" }).of(value) ?? localizedName;
        if (/^[A-Z]{2}/u.test(country)) localizedCountry = new Intl.DisplayNames([locale], { type: "region" }).of(country) ?? country;
      } catch {
        // Keep the catalog fallback when DisplayNames is unavailable.
      }
      return { value, label: localizedCountry ? `${localizedName} · ${localizedCountry}` : localizedName };
    }),
    [locale, t]
  );
  const match = useMemo(() => (base === quote ? null : findCachedRate(rates, base, quote)), [base, quote, rates]);
  const stale = match ? isCachedRateStale(match.record) : false;
  const other = useMemo(() => {
    const value = parseLiveNumber(source);
    if (value === null) return null;
    const from = edited === "from" ? base : quote;
    const to = edited === "from" ? quote : base;
    if (from === to) return value;
    if (!match && from !== to) return null;
    try {
      return convertCurrency(value, from, to, rates);
    } catch {
      return null;
    }
  }, [base, edited, match, quote, rates, source]);
  const fromNumber = edited === "from" ? parseLiveNumber(source) : other;
  const toNumber = edited === "to" ? parseLiveNumber(source) : other;
  const fromText = edited === "from" ? source : (other === null ? "" : formatConvertedInput(other));
  const toText = edited === "to" ? source : (other === null ? "" : formatConvertedInput(other));
  const editFrom = (raw: string) => {
    setEdited("from");
    setSource(raw);
  };
  const editTo = (raw: string) => {
    setEdited("to");
    setSource(raw);
  };
  const swapSides = () => {
    const nextBase = quote;
    const nextQuote = base;
    setSource(toText);
    setEdited("from");
    setBase(nextBase);
    setQuote(nextQuote);
  };
  const effectiveRate = match ? (match.inverted ? 1 / match.rate : match.rate) : base === quote ? 1 : null;

  const lastRefreshToken = useRef(refreshToken);

  useEffect(() => {
    let active = true;
    const cached = readCurrencyCache();
    if (base === quote) {
      return () => {
        active = false;
      };
    }
    // Skip the network round-trip when we already have a fresh cached rate
    // for this exact pair: switching between previously-viewed currencies
    // shouldn't re-hit the API every time. The explicit "Refresh rates"
    // button bumps `refreshToken`, which always forces a re-fetch even if
    // the cache looks fresh — but only on the render where it actually
    // changed, not on every later base/quote switch.
    const forced = refreshToken !== lastRefreshToken.current;
    lastRefreshToken.current = refreshToken;
    const existing = findCachedRate(cached, base, quote);
    if (!forced && existing && !isCachedRateStale(existing.record)) {
      return () => {
        active = false;
      };
    }
    void Promise.resolve().then(() => {
      if (active) setLoading(true);
    });
    fetchFrankfurterRates({ base, symbols: [quote] })
      .then((fetched) => {
        if (!active) return;
        // A recovered fetch must retire the previous failure message.
        setError("");
        setErrorFor("");
        const created = createCachedRateRecords(fetched);
        const next = [...cached.filter((record) => !created.some((item) => item.base === record.base && item.quote === record.quote)), ...created];
        setLiveRates(next);
        writeCurrencyCache(next);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Rate service unavailable");
          setErrorFor(`${base}:${quote}`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, quote, refreshToken]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="space-y-3">
          <Label htmlFor="currency-from-value">{text(t, "from", "From")}</Label>
          <Input id="currency-from-value" value={fromText} onChange={(event) => editFrom(event.target.value)} inputMode="decimal" className="text-lg" />
          <SearchableSelect label={text(t, "from", "From")} hideLabel value={base} options={currencyOptions} onChange={setBase} />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={text(t, "swapCurrencies", "Swap currencies")}
          onClick={swapSides}
          className="justify-self-center"
        >
          <ArrowLeftRight />
        </Button>
        <div className="space-y-3">
          <Label htmlFor="currency-to-value">{text(t, "to", "To")}</Label>
          <Input id="currency-to-value" value={toText} onChange={(event) => editTo(event.target.value)} inputMode="decimal" className="text-lg" />
          <SearchableSelect label={text(t, "to", "To")} hideLabel value={quote} options={currencyOptions} onChange={setQuote} />
        </div>
      </div>
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{text(t, "result", "Result")}</p>
          {fromNumber === null || toNumber === null ? (
            <p className="mt-2 text-lg font-semibold">—</p>
          ) : (
            <p className="mt-2 text-lg font-semibold tabular-nums" dir="ltr">
              <span className="inline-flex flex-wrap items-baseline gap-1.5">
                <AnimatedNumber value={fromNumber} format={{ maximumFractionDigits: 8 }} />
                <span className="text-sm font-medium text-muted-foreground">{base}</span>
                <span className="text-muted-foreground">=</span>
                <AnimatedNumber value={toNumber} format={{ maximumFractionDigits: 8 }} />
                <span className="text-sm font-medium text-muted-foreground">{quote}</span>
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">{loading ? text(t, "loadingRate", "Loading live rate…") : text(t, "rate", "Exchange rate")}</p>
            <p className="mt-1 text-2xl font-semibold">
              {effectiveRate === null ? (
                "—"
              ) : (
                <span className="inline-flex flex-wrap items-baseline gap-1">
                  <span>1 {base} =</span>
                  <AnimatedNumber value={effectiveRate} format={{ maximumFractionDigits: 6 }} />
                  <span>{quote}</span>
                </span>
              )}
            </p>
            {match ? (
              <p className={`mt-2 text-xs ${stale ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
                {stale ? text(t, "stale", "Cached rate is older than six hours; refresh may be needed.") : `${text(t, "asOf", "Rate date")} ${match.record.date}`}
              </p>
            ) : null}
            {displayError ? <p className="mt-2 text-xs text-destructive">{displayError}{match ? ` ${text(t, "usingCache", "Using the last cached rate.")}` : ""}</p> : null}
            {match && liveRates && !stale ? <p className="mt-1 text-xs text-muted-foreground">{text(t, "updated", "Updated just now")}</p> : null}
          </div>
          <Button variant="outline" onClick={() => setRefreshToken((value) => value + 1)} disabled={loading} className="sm:self-start">
            <RefreshCw className={loading ? "animate-spin" : ""} /> {text(t, "refresh", "Refresh")}
          </Button>
        </CardContent>
      </Card>
      <Button
        variant="outline"
        onClick={() => {
          log(fromNumber === null || toNumber === null ? `${fromText} ${base} → ${quote}` : `${fromText} ${base} → ${toNumber} ${quote}`, "success", { stale, maxAgeMs: DEFAULT_RATE_MAX_AGE_MS });
          notifyHistorySaved(text(t, "saved", "Conversion saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
        }}
      >
        <Check /> {text(t, "record", "Record conversion")}
      </Button>
    </div>
  );
}

export function CurrencyConverterTool() {
  const t = useTranslations("tools.currency-converter");
  return (
    <ToolShell toolId="currency-converter">
      <ToolLimits>
        <p>{text(t, "limits", "Currency rates come from Frankfurter when this tool opens or you tap Refresh, then stay in this browser cache for six hours. Amounts are not sent. Rates are daily reference data, not for trading or tax.")}</p>
      </ToolLimits>
      <CurrencyConverter namespace="tools.currency-converter" />
    </ToolShell>
  );
}
