type CronNames = { months: readonly string[]; days: readonly string[] };

const ENGLISH_NAMES: CronNames = {
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const namesByLocale = new Map<string, CronNames>([["en", ENGLISH_NAMES]]);

function cronNames(locale?: string): CronNames {
  if (!locale) return ENGLISH_NAMES;
  const cached = namesByLocale.get(locale);
  if (cached) return cached;
  try {
    const monthFmt = new Intl.DateTimeFormat(locale, { month: "long" });
    const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "long" });
    const names: CronNames = {
      months: Array.from({ length: 12 }, (_, i) => monthFmt.format(new Date(2000, i, 15))),
      days: Array.from({ length: 7 }, (_, i) => dayFmt.format(new Date(2000, 0, 2 + i))),
    };
    namesByLocale.set(locale, names);
    return names;
  } catch {
    return ENGLISH_NAMES;
  }
}

function describeField(value: string, kind: "min" | "hour" | "dom" | "mon" | "dow", names: CronNames): string {
  const v = value.trim();
  if (v === "*") {
    if (kind === "min") return "every minute";
    if (kind === "hour") return "every hour";
    if (kind === "dom") return "every day of the month";
    if (kind === "mon") return "every month";
    return "every day of the week";
  }
  if (v.startsWith("*/")) {
    const n = parseInt(v.slice(2), 10);
    if (!Number.isFinite(n) || n < 1) return v;
    if (kind === "min") return `every ${n} minutes`;
    if (kind === "hour") return `every ${n} hours`;
    if (kind === "dom") return `every ${n} days of the month`;
    if (kind === "mon") return `every ${n} months`;
    return `every ${n} days of the week`;
  }
  if (v.includes("-") && !v.includes(",")) {
    const [a, b] = v.split("-");
    return `from ${label(kind, a, names)} through ${label(kind, b, names)}`;
  }
  if (v.includes(",")) {
    return v
      .split(",")
      .map((p) => label(kind, p, names))
      .join(", ");
  }
  return label(kind, v, names);
}

function label(kind: "min" | "hour" | "dom" | "mon" | "dow", raw: string, names: CronNames): string {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return raw;
  if (kind === "mon") return names.months[((n - 1) % 12 + 12) % 12] || raw;
  if (kind === "dow") return names.days[((n % 7) + 7) % 7] || raw;
  if (kind === "hour") return `${String(n).padStart(2, "0")}:00`;
  if (kind === "min") return `:${String(n).padStart(2, "0")}`;
  return String(n);
}

export function explainCron(expr: string, locale?: string): { ok: true; text: string; fields: string[] } | { ok: false; error: string } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { ok: false, error: "Use a 5-field cron: minute hour day-of-month month day-of-week" };
  }
  const names = cronNames(locale);
  const [min, hour, dom, mon, dow] = parts;
  const fields = [
    describeField(min, "min", names),
    describeField(hour, "hour", names),
    describeField(dom, "dom", names),
    describeField(mon, "mon", names),
    describeField(dow, "dow", names),
  ];
  const text = `At ${fields[0]}, ${fields[1]}; ${fields[2]}; ${fields[3]}; ${fields[4]}.`;
  return { ok: true, text, fields };
}
