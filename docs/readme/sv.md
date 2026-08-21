# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Alla 30 README-språk</summary>

- [English](../../README.md)
- [Español](es.md)
- [Français](fr.md)
- [Deutsch](de.md)
- [Italiano](it.md)
- [Português (Brasil)](pt-BR.md)
- [Português (Portugal)](pt-PT.md)
- [Nederlands](nl.md)
- [Dansk](da.md)
- **Svenska**
- [Norsk Bokmål](nb.md)
- [Suomi](fi.md)
- [Polski](pl.md)
- [Čeština](cs.md)
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

**Vardagsverktyg i webbläsaren. Privata från början.**

Kit är en uppsättning PDF-, bild-, media-, konverterings- och textverktyg som körs på din enhet. Bearbetningen stannar i webbläsaren — ingenting skickas till en Kit-server.

**Webbplats:** https://trykit.pages.dev

**Om författaren:** https://t-g.pages.dev

## Vad du får

En genomarbetad verktygslåda: tydlig layout, ljust och mörkt, 30 språk med en inbyggd väljare, installerbar PWA och ärliga gränser för vad en webbläsare kan.

## Språk

Appens gränssnitt och denna GitHub-README finns på **30 språk**. Byt i Inställningar (eller sidhuvudet) med en inbyggd väljare, eller använd länkarna högst upp. Arabiska och hebreiska är höger-till-vänster. Integritet och villkor är översatta där det finns egen juridisk text; annars engelska. Gamla `/zh/`-länkar går fortfarande till förenklad kinesiska.

## Verktyg

Startsidan grupperar verktyg efter uppgift (PDF-sidor, data, utveckling …) i stället för en platt lista.

### PDF
- Slå ihop, dela, organisera, sidnummer
- Komprimera, lås/lås upp, metadata, platta ut
- Vattenstämpel, visuell täckning, skriven signatur
- Extrahera text, PDF → bild-ZIP, bilder → PDF

### Bilder
- Komprimera, skala, beskära, rotera/spegla, favicon-paket
- Justera, filter, vattenstämpel
- Konvertera JPEG/PNG/WEBP, visa/ta bort EXIF

### Ljud och video
- Konvertera, beskära med vågform, hastighet/volym, extrahera ljud, klipp → GIF  
  *(FFmpeg WASM; stora filer kan vara långsamma; begränsade codecs)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript-gränssnitt
- Konverteringshubb

### Skrivande
- Markdown ↔ HTML, textjämförelse, versaler/gemener, Lorem ipsum

### Utveckling
- Avkoda JWT, Unix-tidsstämpel, cron, talbas
- Hash (SHA/MD5), regex, färg
- Base64, URL, HTML-entiteter
- UUID, lösenordsgenerator, QR

## Integritet

- Verktyg behandlar data **på din enhet**
- Historiken sparar bara **sammanfattningar** (inte filinnehåll)
- Inställningar stannar i lokal lagring
- [Integritetspolicy](https://trykit.pages.dev/sv/privacy/) · [Användarvillkor](https://trykit.pages.dev/sv/terms/)

## Lokal utveckling

Krav: **Node.js 22.13+** (se `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Öppna http://localhost:3000 — standardspråket omdirigerar till `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Bassökväg

För GitHub-projektsidor, bygg med:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokalt inget prefix (`NEXT_PUBLIC_BASE_PATH` tom).

## Publicera på GitHub Pages

### Automatiskt (rekommenderas)

1. Pusha detta repo till **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Arbetsflödet [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) bygger med `NEXT_PUBLIC_BASE_PATH=/kit` och publicerar `out/`

### Manuellt

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages-URL: `https://TGthms.github.io/kit/`  
Kanonisk sajt: `https://trykit.pages.dev`

## Teknik

Next.js 15 (App Router, statisk export) · TypeScript · Tailwind CSS · UI i shadcn-stil · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA-service worker

## Licens

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
