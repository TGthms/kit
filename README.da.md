# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Alle 30 README-sprog</summary>

- [English](README.md)
- [Español](README.es.md)
- [Français](README.fr.md)
- [Deutsch](README.de.md)
- [Italiano](README.it.md)
- [Português (Brasil)](README.pt-BR.md)
- [Português (Portugal)](README.pt-PT.md)
- [Nederlands](README.nl.md)
- **Dansk**
- [Svenska](README.sv.md)
- [Norsk Bokmål](README.nb.md)
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

**Hverdagsværktøjer i browseren. Private fra starten.**

Kit er et sæt PDF-, billed-, medie-, konverterings- og tekstværktøjer, der kører på din enhed. Behandlingen bliver i browseren — intet sendes til en Kit-server.

**Websted:** https://trykit.pages.dev

**Om forfatteren:** https://tgthms.github.io/about/

## Hvad du får

Et gennemarbejdet værktøjssæt: klart layout, lyst og mørkt, 30 sprog med en indbygget vælger, installerbar PWA og ærlige grænser for, hvad en browser kan.

## Sprog

App-grænsefladen og denne GitHub-README findes på **30 sprog**. Skift i Indstillinger (eller overskriften) med en indbygget vælger, eller brug linkene øverst. Arabisk og hebraisk er højre-mod-venstre. Privatliv og vilkår er oversat, hvor der findes egen juridisk tekst; ellers engelsk. Gamle `/zh/`-links går stadig til forenklet kinesisk.

## Værktøjer

Startsiden grupperer værktøjer efter opgave (PDF-sider, data, udvikling …) i stedet for én flad liste.

### PDF
- Flet, split, organisér, sidetal
- Komprimér, lås/lås op, metadata, fladgør
- Vandmærke, visuel tildækning, indtastet underskrift
- Udtræk tekst, PDF → billed-ZIP, billeder → PDF

### Billeder
- Komprimér, skaler, beskær, roter/spejl, favicon-pakke
- Justér, filtre, vandmærke
- Konvertér JPEG/PNG/WEBP, se/fjern EXIF

### Lyd og video
- Konvertér, beskær med bølgeform, hastighed/lydstyrke, udtræk lyd, klip → GIF  
  *(FFmpeg WASM; store filer kan være langsomme; begrænsede codecs)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript-interfaces
- Konverteringshub

### Skrivning
- Markdown ↔ HTML, tekstsammenligning, store/små bogstaver, Lorem ipsum

### Udvikling
- Afkod JWT, Unix-tidsstempel, cron, talkbase
- Hash (SHA/MD5), regex, farve
- Base64, URL, HTML-entiteter
- UUID, adgangskodegenerator, QR

## Privatliv

- Værktøjer behandler data **på din enhed**
- Historik gemmer kun **resuméer** (ikke filindhold)
- Indstillinger bliver i lokal lagring
- [Privatlivspolitik](https://trykit.pages.dev/da/privacy/) · [Brugsvilkår](https://trykit.pages.dev/da/terms/)

## Lokal udvikling

Krav: **Node.js 22.13+** (se `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Åbn http://localhost:3000 — standardsproget omdirigerer til `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Basissti

Til GitHub-projektsider bygges med:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokalt intet præfiks (`NEXT_PUBLIC_BASE_PATH` tom).

## Udgiv på GitHub Pages

### Automatisk (anbefalet)

1. Push dette repo til **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Workflowet [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) bygger med `NEXT_PUBLIC_BASE_PATH=/kit` og udgiver `out/`

### Manuelt

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages-URL: `https://TGthms.github.io/kit/`  
Kanonisk site: `https://trykit.pages.dev`

## Teknologi

Next.js 15 (App Router, statisk eksport) · TypeScript · Tailwind CSS · UI i shadcn-stil · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA-service worker

## Licens

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
