export type CaseStyle = "lower" | "upper" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "constant";

function words(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

export function convertCase(input: string, style: CaseStyle): string {
  if (style === "lower") return input.toLowerCase();
  if (style === "upper") return input.toUpperCase();
  if (style === "title") {
    return input
      .toLowerCase()
      .replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  }
  if (style === "sentence") {
    return input.toLowerCase().replace(/^\s*\p{L}/u, (c) => c.toUpperCase());
  }
  const w = words(input);
  if (!w.length) return "";
  if (style === "camel") return w[0] + w.slice(1).map((x) => x[0].toUpperCase() + x.slice(1)).join("");
  if (style === "pascal") return w.map((x) => x[0].toUpperCase() + x.slice(1)).join("");
  if (style === "snake") return w.join("_");
  if (style === "kebab") return w.join("-");
  return w.map((x) => x.toUpperCase()).join("_");
}
