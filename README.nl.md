# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Alle 30 README-talen</summary>

- [English](README.md)
- [Español](README.es.md)
- [Français](README.fr.md)
- [Deutsch](README.de.md)
- [Italiano](README.it.md)
- [Português (Brasil)](README.pt-BR.md)
- [Português (Portugal)](README.pt-PT.md)
- **Nederlands**
- [Dansk](README.da.md)
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

**Alledaagse tools in de browser. Privé vanaf het ontwerp.**

Kit is een set pdf-, beeld-, media-, conversie- en teksttools die op uw apparaat draaien. Verwerking blijft in de browser — er gaat niets naar een Kit-server.

**Site:** https://trykit.pages.dev

**Over de auteur:** https://tgthms.github.io/about/

## Wat u krijgt

Een verzorgde toolkit: heldere layout, licht en donker, 30 talen met een native kiezer, installeerbare PWA en eerlijke grenzen van wat een browser kan.

## Talen

De app-interface en deze GitHub-README bestaan in **30 talen**. Wissel in Instellingen (of de kop) met een native kiezer, of gebruik de links bovenaan. Arabisch en Hebreeuws gaan van rechts naar links. Privacy en voorwaarden zijn vertaald waar eigen juridische tekst is; anders Engels. Oude `/zh/`-links gaan nog naar Vereenvoudigd Chinees.

## Tools

Het startscherm groepeert tools per taak (pdf-pagina’s, data, ontwikkeling…) in plaats van één platte lijst.

### PDF
- Samenvoegen, splitsen, organiseren, paginanummers
- Comprimeren, vergrendelen/ontgrendelen, metadata, afvlakken
- Watermerk, visueel afdekken, getypte handtekening
- Tekst extraheren, pdf → afbeeldingen-ZIP, afbeeldingen → pdf

### Afbeeldingen
- Comprimeren, schalen, bijsnijden, draaien/spiegelen, favicon-pakket
- Aanpassen, filters, watermerk
- JPEG/PNG/WEBP converteren, EXIF bekijken/verwijderen

### Audio en video
- Converteren, knippen met golfvorm, snelheid/volume, audio extraheren, clip → GIF  
  *(FFmpeg WASM; grote bestanden kunnen traag zijn; beperkte codecs)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript-interfaces
- Conversiehub

### Schrijven
- Markdown ↔ HTML, tekstvergelijking, hoofd-/kleine letters, Lorem ipsum

### Ontwikkeling
- JWT decoderen, Unix-tijdstempel, cron, getallenbasis
- Hash (SHA/MD5), regex, kleur
- Base64, URL, HTML-entiteiten
- UUID, wachtwoordgenerator, QR

## Privacy

- Tools verwerken gegevens **op uw apparaat**
- Geschiedenis bewaart alleen **samenvattingen** (geen bestandsinhoud)
- Voorkeuren blijven in lokale opslag
- [Privacybeleid](https://trykit.pages.dev/nl/privacy/) · [Gebruiksvoorwaarden](https://trykit.pages.dev/nl/terms/)

## Lokale ontwikkeling

Vereisten: **Node.js 22.13+** (zie `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Open http://localhost:3000 — de standaardtaal gaat naar `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Basispad

Voor GitHub-projectpagina’s bouwt u met:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokaal geen voorvoegsel (`NEXT_PUBLIC_BASE_PATH` leeg).

## Publiceren op GitHub Pages

### Automatisch (aanbevolen)

1. Push deze repo naar **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. De workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) bouwt met `NEXT_PUBLIC_BASE_PATH=/kit` en publiceert `out/`

### Handmatig

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages-URL: `https://TGthms.github.io/kit/`  
Canonieke site: `https://trykit.pages.dev`

## Techniek

Next.js 15 (App Router, statische export) · TypeScript · Tailwind CSS · UI in shadcn-stijl · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA-serviceworker

## Licentie

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
