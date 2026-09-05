#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const PAGE_KEYS = [
  ["subtitleFacts", "kit1"],
  ["subtitleFacts", "kit3"],
  ["subtitleFacts", "kit6"],
  ["subtitleFacts", "fact2"],
  ["subtitleFacts", "fact6"],
  ["subtitleObservance", "dataPrivacyDay"],
  ["subtitleObservance", "dataPrivacyDay2"],
  ["subtitleObservance", "dataPrivacyDay3"],
  ["subtitleObservance", "saferInternetDay2"],
  ["subtitleObservance", "saferInternetDay3"],
  ["subtitleObservance", "computerSecurityDay2"],
  ["subtitleObservance", "computerSecurityDay3"],
];

const TOOL_WRAP_FIRST_CLAUSE = [["subtitleObservance", "passwordDay2"]];
const TOOL_APPEND = [
  ["subtitleObservance", "passwordDay3"],
  ["subtitleObservance", "encryptionDay2"],
];

const LEARN_MORE = {
  es: "Saber más",
  fr: "En savoir plus",
  de: "Mehr erfahren",
  it: "Scopri di più",
  "pt-BR": "Saiba mais",
  "pt-PT": "Saber mais",
  nl: "Meer informatie",
  da: "Læs mere",
  sv: "Läs mer",
  nb: "Les mer",
  fi: "Lue lisää",
  pl: "Dowiedz się więcej",
  cs: "Zjistit více",
  hu: "Tudj meg többet",
  ro: "Află mai multe",
  el: "Μάθε περισσότερα",
  tr: "Daha fazla",
  ru: "Подробнее",
  uk: "Дізнатися більше",
  ar: "اعرف المزيد",
  he: "מידע נוסף",
  hi: "और जानें",
  th: "ดูเพิ่มเติม",
  vi: "Tìm hiểu thêm",
  id: "Pelajari lebih lanjut",
  ja: "詳しく見る",
  ko: "더 알아보기",
  "zh-Hans": "了解更多",
  "zh-Hant": "了解更多",
  zh: "了解更多",
};

const GENERATE_HERE = {
  es: "Genera una aquí",
  fr: "En générer une ici",
  de: "Hier eine erzeugen",
  it: "Generane una qui",
  "pt-BR": "Gere uma aqui",
  "pt-PT": "Gera uma aqui",
  nl: "Genereer er hier een",
  da: "Generér en her",
  sv: "Skapa en här",
  nb: "Lag én her",
  fi: "Luo yksi täällä",
  pl: "Wygeneruj tutaj",
  cs: "Vygenerovat zde",
  hu: "Generálj egyet itt",
  ro: "Generează una aici",
  el: "Δημιούργησε μία εδώ",
  tr: "Burada oluştur",
  ru: "Создать здесь",
  uk: "Створити тут",
  ar: "أنشئ واحدة هنا",
  he: "צור אחת כאן",
  hi: "यहाँ बनाएँ",
  th: "สร้างที่นี่",
  vi: "Tạo một cái ở đây",
  id: "Buat satu di sini",
  ja: "ここで作る",
  ko: "여기서 만들기",
  "zh-Hans": "在这里生成",
  "zh-Hant": "在這裡產生",
  zh: "在这里生成",
};

function wrapFirstClause(value, tag) {
  if (value.includes(`<${tag}>`)) return value;
  const match = value.match(/^(.{8,72}?)([,，、:：—–\-])/u);
  if (match) return `<${tag}>${match[1]}</${tag}>${match[2]}${value.slice(match[0].length)}`;
  return value;
}

function appendTag(value, tag, label) {
  if (value.includes(`<${tag}>`)) return value;
  return `${value.replace(/\s+$/u, "")} <${tag}>${label}</${tag}>`;
}

const dir = path.join(root, "messages");
for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json"))) {
  const locale = file.slice(0, -5);
  if (locale === "en") continue;
  const catalog = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const learn = LEARN_MORE[locale];
  const generate = GENERATE_HERE[locale];
  if (!learn || !generate) throw new Error(`missing labels for ${locale}`);

  for (const [group, key] of PAGE_KEYS) {
    catalog.home[group][key] = appendTag(catalog.home[group][key], "page", learn);
  }
  for (const [group, key] of TOOL_WRAP_FIRST_CLAUSE) {
    const wrapped = wrapFirstClause(catalog.home[group][key], "tool");
    catalog.home[group][key] = wrapped.includes("<tool>") ? wrapped : appendTag(wrapped, "tool", generate);
  }
  for (const [group, key] of TOOL_APPEND) {
    catalog.home[group][key] = appendTag(catalog.home[group][key], "tool", generate);
  }

  fs.writeFileSync(path.join(dir, file), `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`tagged ${locale}`);
}
