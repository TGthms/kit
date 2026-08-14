# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · **Deutsch** · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Alle 30 README-Sprachen</summary>

- [English](README.md)
- [Español](README.es.md)
- [Français](README.fr.md)
- **Deutsch**
- [Italiano](README.it.md)
- [Português (Brasil)](README.pt-BR.md)
- [Português (Portugal)](README.pt-PT.md)
- [Nederlands](README.nl.md)
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

**Alltagswerkzeuge im Browser. Von Grund auf privat.**

Kit ist eine Sammlung von PDF-, Bild-, Medien-, Konverter- und Textwerkzeugen, die auf Ihrem Gerät laufen. Die Verarbeitung bleibt im Browser — nichts wird an einen Kit-Server gesendet.

**Website:** https://trykit.pages.dev

**Über den Autor:** https://tgthms.github.io/about/

## Was Sie bekommen

Ein durchdachtes Werkzeugset: klare Oberfläche, hell und dunkel, 30 Sprachen mit nativem Auswahlfeld, installierbare PWA und ehrliche Grenzen dessen, was ein Browser kann.

## Sprachen

App-Oberfläche und dieses GitHub-README gibt es in **30 Sprachen**. Wechseln Sie in den Einstellungen (oder der Kopfzeile) mit einem nativen Auswahlfeld oder über die Links oben. Arabisch und Hebräisch sind rechts-nach-links. Datenschutz und Nutzungsbedingungen sind übersetzt, wo es eigenen Rechtstext gibt; sonst Englisch. Alte `/zh/`-Links führen weiter zu vereinfachtem Chinesisch.

## Werkzeuge

Die Startseite gruppiert Werkzeuge nach Aufgabe (PDF-Seiten, Daten, Entwicklung …), nicht als flache Liste.

### PDF
- Zusammenführen, teilen, organisieren, Seitenzahlen
- Komprimieren, sperren/entsperren, Metadaten, flachlegen
- Wasserzeichen, visuelle Abdeckung, getippte Signatur
- Text extrahieren, PDF → Bilder-ZIP, Bilder → PDF

### Bilder
- Komprimieren, skalieren, zuschneiden, drehen/spiegeln, Favicon-Paket
- Anpassen, Filter, Wasserzeichen
- JPEG/PNG/WEBP konvertieren, EXIF ansehen/entfernen

### Audio und Video
- Konvertieren, mit Wellenform zuschneiden, Tempo/Lautstärke, Audio extrahieren, Clip → GIF  
  *(FFmpeg WASM; große Dateien können langsam sein; begrenzte Codecs)*

### Daten
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript-Interfaces
- Konvertierungs-Hub

### Schreiben
- Markdown ↔ HTML, Textvergleich, Groß-/Kleinschreibung, Lorem ipsum

### Entwicklung
- JWT dekodieren, Unix-Zeitstempel, Cron, Zahlenbasis
- Hash (SHA/MD5), Regex, Farbe
- Base64, URL, HTML-Entitäten
- UUID, Passwortgenerator, QR

## Datenschutz

- Werkzeuge verarbeiten Daten **auf Ihrem Gerät**
- Der Verlauf speichert nur **Kurzfassungen** (keine Dateiinhalte)
- Einstellungen bleiben im lokalen Speicher
- [Datenschutzerklärung](https://trykit.pages.dev/de/privacy/) · [Nutzungsbedingungen](https://trykit.pages.dev/de/terms/)

## Lokale Entwicklung

Voraussetzung: **Node.js 22.13+** (siehe `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Öffnen Sie http://localhost:3000 — die Standardsprache leitet nach `/en/` um.

```bash
npm run build
npm run typecheck
npm run lint
```

### Basispfad

Für GitHub-Projektseiten bauen Sie mit:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokal kein Präfix (`NEXT_PUBLIC_BASE_PATH` leer).

## Auf GitHub Pages veröffentlichen

### Automatisch (empfohlen)

1. Dieses Repo nach **https://github.com/TGthms/kit** pushen
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Der Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) baut mit `NEXT_PUBLIC_BASE_PATH=/kit` und veröffentlicht `out/`

### Manuell

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages-URL: `https://TGthms.github.io/kit/`  
Kanonische Website: `https://trykit.pages.dev`

## Technik

Next.js 15 (App Router, statischer Export) · TypeScript · Tailwind CSS · UI im shadcn-Stil · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA-Service-Worker

## Lizenz

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
