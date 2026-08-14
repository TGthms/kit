const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describeField(value: string, kind: "min" | "hour" | "dom" | "mon" | "dow"): string {
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
    return `from ${label(kind, a)} through ${label(kind, b)}`;
  }
  if (v.includes(",")) {
    return v
      .split(",")
      .map((p) => label(kind, p))
      .join(", ");
  }
  return label(kind, v);
}

function label(kind: "min" | "hour" | "dom" | "mon" | "dow", raw: string): string {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return raw;
  if (kind === "mon") return MONTHS[((n - 1) % 12 + 12) % 12] || raw;
  if (kind === "dow") return DOW[((n % 7) + 7) % 7] || raw;
  if (kind === "hour") return `${String(n).padStart(2, "0")}:00`;
  if (kind === "min") return `:${String(n).padStart(2, "0")}`;
  return String(n);
}

export function explainCron(expr: string): { ok: true; text: string; fields: string[] } | { ok: false; error: string } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { ok: false, error: "Use a 5-field cron: minute hour day-of-month month day-of-week" };
  }
  const [min, hour, dom, mon, dow] = parts;
  const fields = [
    describeField(min, "min"),
    describeField(hour, "hour"),
    describeField(dom, "dom"),
    describeField(mon, "mon"),
    describeField(dow, "dow"),
  ];
  const text = `At ${fields[0]}, ${fields[1]}; ${fields[2]}; ${fields[3]}; ${fields[4]}.`;
  return { ok: true, text, fields };
}
