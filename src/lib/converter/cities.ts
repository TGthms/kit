export type City = {
  name: string;
  zone: string;
  emoji: string;
  key: string;
};

/** Small, curated city set for the world-clock UI. Intl supplies DST rules. */
export const CITIES: readonly City[] = [
  { name: "San Francisco", key: "citySanFrancisco", zone: "America/Los_Angeles", emoji: "SF" },
  { name: "New York", key: "cityNewYork", zone: "America/New_York", emoji: "NY" },
  { name: "Chicago", key: "cityChicago", zone: "America/Chicago", emoji: "CHI" },
  { name: "Toronto", key: "cityToronto", zone: "America/Toronto", emoji: "YYZ" },
  { name: "Mexico City", key: "cityMexicoCity", zone: "America/Mexico_City", emoji: "MEX" },
  { name: "São Paulo", key: "citySaoPaulo", zone: "America/Sao_Paulo", emoji: "SAO" },
  { name: "London", key: "cityLondon", zone: "Europe/London", emoji: "LDN" },
  { name: "Paris", key: "cityParis", zone: "Europe/Paris", emoji: "PAR" },
  { name: "Berlin", key: "cityBerlin", zone: "Europe/Berlin", emoji: "BER" },
  { name: "Dubai", key: "cityDubai", zone: "Asia/Dubai", emoji: "DXB" },
  { name: "Mumbai", key: "cityMumbai", zone: "Asia/Kolkata", emoji: "BOM" },
  { name: "Beijing", key: "cityBeijing", zone: "Asia/Shanghai", emoji: "BJS" },
  { name: "Hong Kong, China", key: "cityHongKongChina", zone: "Asia/Hong_Kong", emoji: "HKG" },
  { name: "Singapore", key: "citySingapore", zone: "Asia/Singapore", emoji: "SIN" },
  { name: "Tokyo", key: "cityTokyo", zone: "Asia/Tokyo", emoji: "TYO" },
  { name: "Sydney", key: "citySydney", zone: "Australia/Sydney", emoji: "SYD" },
  { name: "Auckland", key: "cityAuckland", zone: "Pacific/Auckland", emoji: "AKL" },
  { name: "Johannesburg", key: "cityJohannesburg", zone: "Africa/Johannesburg", emoji: "JNB" },
];

export function cityTimeZones(): string[] {
  return Array.from(new Set([...CITIES.map((city) => city.zone), "UTC"]));
}
