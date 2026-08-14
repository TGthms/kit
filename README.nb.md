# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Alle 30 README-språk</summary>

- [English](README.md)
- [Español](README.es.md)
- [Français](README.fr.md)
- [Deutsch](README.de.md)
- [Italiano](README.it.md)
- [Português (Brasil)](README.pt-BR.md)
- [Português (Portugal)](README.pt-PT.md)
- [Nederlands](README.nl.md)
- [Dansk](README.da.md)
- [Svenska](README.sv.md)
- **Norsk Bokmål**
- [Suomi](README.fi.md)
- [Polski](README.pl.md)
- [Čeština](README.cs.md)
- [Magyar](README.hu.md)
- [Română](README.ro.md)
- [Ελληνικά](README.el.md)
- [Türkçe](README.tr.md)
- [Русский](README.ru.md)
- [Українська](README.uk.md)
- [العربية](README.ar.md)
- [עברית](README.he.md)
- [हिन्दी](README.hi.md)
- [ไทย](README.th.md)
- [Tiếng Việt](README.vi.md)
- [Bahasa Indonesia](README.id.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [简体中文](README.zh-Hans.md)
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Hverdagsverktøy i nettleseren. Private fra starten.**

Kit er et sett med PDF-, bilde-, medie-, konverterings- og tekstverktøy som kjører på enheten din. Behandlingen blir i nettleseren — ingenting sendes til en Kit-tjener.

**Nettsted:** https://trykit.pages.dev

**Om forfatteren:** https://tgthms.github.io/about/

## Hva du får

Et gjennomarbeidet verktøysett: tydelig layout, lyst og mørkt, 30 språk med en innebygd velger, installerbar PWA og ærlige grenser for hva en nettleser kan.

## Språk

Appgrensesnittet og denne GitHub-README-en finnes på **30 språk**. Bytt i Innstillinger (eller toppfeltet) med en innebygd velger, eller bruk lenkene øverst. Arabisk og hebraisk er høyre-til-venstre. Personvern og vilkår er oversatt der det finnes egen juridisk tekst; ellers engelsk. Gamle `/zh/`-lenker går fortsatt til forenklet kinesisk.

## Verktøy

Startsiden grupperer verktøy etter oppgave (PDF-sider, data, utvikling …) i stedet for én flat liste.

### PDF
- Slå sammen, del, organiser, sidetall
- Komprimer, lås/lås opp, metadata, flat ut
- Vannmerke, visuell tildekking, skrevet signatur
- Trekk ut tekst, PDF → bilde-ZIP, bilder → PDF

### Bilder
- Komprimer, skaler, beskjær, roter/speil, favicon-pakke
- Juster, filtre, vannmerke
- Konverter JPEG/PNG/WEBP, se/fjern EXIF

### Lyd og video
- Konverter, beskjær med bølgeform, hastighet/volum, trekk ut lyd, klipp → GIF  
  *(FFmpeg WASM; store filer kan være trege; begrensede kodeker)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript-grensesnitt
- Konverteringshub

### Skriving
- Markdown ↔ HTML, tekstsammenligning, store/små bokstaver, Lorem ipsum

### Utvikling
- Dekod JWT, Unix-tidsstempel, cron, tallbase
- Hash (SHA/MD5), regex, farge
- Base64, URL, HTML-entiteter
- UUID, passordgenerator, QR

## Personvern

- Verktøy behandler data **på enheten din**
- Historikken lagrer bare **sammendrag** (ikke filinnhold)
- Innstillinger blir i lokal lagring
- [Personvernerklæring](https://trykit.pages.dev/nb/privacy/) · [Bruksvilkår](https://trykit.pages.dev/nb/terms/)

## Lokal utvikling

Krav: **Node.js 22.13+** (se `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Åpne http://localhost:3000 — standardspråket omdirigerer til `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Grunnsti

For GitHub-prosjektsider, bygg med:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokalt ingen prefiks (`NEXT_PUBLIC_BASE_PATH` tom).

## Publiser på GitHub Pages

### Automatisk (anbefalt)

1. Push dette repoet til **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Arbeidsflyten [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) bygger med `NEXT_PUBLIC_BASE_PATH=/kit` og publiserer `out/`

### Manuelt

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages-URL: `https://TGthms.github.io/kit/`  
Kanonisk nettsted: `https://trykit.pages.dev`

## Teknologi

Next.js 15 (App Router, statisk eksport) · TypeScript · Tailwind CSS · UI i shadcn-stil · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA-service worker

## Lisens

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
