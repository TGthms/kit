# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Všech 30 jazyků README</summary>

- [English](../../README.md)
- [Español](es.md)
- [Français](fr.md)
- [Deutsch](de.md)
- [Italiano](it.md)
- [Português (Brasil)](pt-BR.md)
- [Português (Portugal)](pt-PT.md)
- [Nederlands](nl.md)
- [Dansk](da.md)
- [Svenska](sv.md)
- [Norsk Bokmål](nb.md)
- [Suomi](fi.md)
- [Polski](pl.md)
- **Čeština**
- [Magyar](hu.md)
- [Română](ro.md)
- [Ελληνικά](el.md)
- [Türkçe](tr.md)
- [Русский](ru.md)
- [Українська](uk.md)
- [العربية](ar.md)
- [עברית](he.md)
- [हिन्दी](hi.md)
- [ไทย](th.md)
- [Tiếng Việt](vi.md)
- [Bahasa Indonesia](id.md)
- [日本語](ja.md)
- [한국어](ko.md)
- [简体中文](zh-Hans.md)
- [繁體中文](zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**Každodenní nástroje v prohlížeči. Soukromé od návrhu.**

Kit je sada nástrojů pro PDF, obrázky, média, převody a text, které běží na vašem zařízení. Zpracování zůstává v prohlížeči — nic se neodesílá na server Kit.

**Web:** https://trykit.pages.dev

**O autorovi:** https://t-g.pages.dev

## Co získáte

Propracovaná sada: přehledné rozložení, světlý a tmavý vzhled, 30 jazyků s nativním výběrem, instalovatelná PWA a poctivé limity toho, co prohlížeč umí.

## Jazyky

Rozhraní aplikace i tento GitHub README jsou v **30 jazycích**. Přepínejte v Nastavení (nebo v záhlaví) nativním výběrem, nebo použijte odkazy nahoře. Arabština a hebrejština jdou zprava doleva. Soukromí a podmínky jsou přeložené, pokud existuje vlastní právní text; jinak angličtina. Staré odkazy `/zh/` stále vedou ke zjednodušené čínštině.

## Nástroje

Domovská obrazovka seskupuje nástroje podle úlohy (stránky PDF, data, vývoj…) místo jedné ploché nabídky.

### PDF
- Sloučit, rozdělit, uspořádat, čísla stránek
- Komprimovat, zamknout/odemknout, metadata, zploštit
- Vodoznak, vizuální zakrytí, napsaný podpis
- Extrahovat text, PDF → ZIP obrázků, obrázky → PDF

### Obrázky
- Komprimovat, změnit velikost, oříznout, otočit/překlopit, balíček favicon
- Úpravy, filtry, vodoznak
- Převést JPEG/PNG/WEBP, zobrazit/odebrat EXIF

### Zvuk a video
- Převést, oříznout s průběhem, rychlost/hlasitost, extrahovat zvuk, klip → GIF  
  *(FFmpeg WASM; velké soubory mohou být pomalé; omezené kodeky)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → rozhraní TypeScript
- Převodní hub

### Psaní
- Markdown ↔ HTML, porovnání textu, velikost písmen, Lorem ipsum

### Vývoj
- Dekódovat JWT, unixový čas, cron, číselná soustava
- Hash (SHA/MD5), regex, barva
- Base64, URL, HTML entity
- UUID, generátor hesel, QR

## Soukromí

- Nástroje zpracovávají data **na vašem zařízení**
- Historie ukládá jen **souhrny** (ne obsah souborů)
- Předvolby zůstávají v místním úložišti
- [Zásady ochrany soukromí](https://trykit.pages.dev/cs/privacy/) · [Podmínky použití](https://trykit.pages.dev/cs/terms/)

## Místní vývoj

Požadavky: **Node.js 22.13+** (viz `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Otevřete http://localhost:3000 — výchozí jazyk přesměruje na `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Základní cesta

Pro GitHub Pages projektu sestavte s:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokálně bez prefixu (`NEXT_PUBLIC_BASE_PATH` prázdné).

## Nasazení na GitHub Pages

### Automaticky (doporučeno)

1. Odešlete toto repo na **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) sestaví s `NEXT_PUBLIC_BASE_PATH=/kit` a zveřejní `out/`

### Ručně

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Adresa Pages: `https://TGthms.github.io/kit/`  
Kanonický web: `https://trykit.pages.dev`

## Technologie

Next.js 15 (App Router, statický export) · TypeScript · Tailwind CSS · UI ve stylu shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA service worker

## Licence

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
