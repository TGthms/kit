# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Toate cele 30 de limbi ale README</summary>

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
- [Čeština](cs.md)
- [Magyar](hu.md)
- **Română**
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

**Unelte de zi cu zi în browser. Private prin concepție.**

Kit este un set de unelte PDF, imagine, media, conversie și text care rulează pe dispozitivul tău. Prelucrarea rămâne în browser — nimic nu este trimis către un server Kit.

**Site:** https://trykit.pages.dev

**Despre autor:** https://t-g.pages.dev

## Ce obții

Un set îngrijit: aspect clar, temă deschisă și închisă, 30 de limbi cu selector nativ, PWA instalabilă și limite sincere despre ce poate un browser.

## Limbi

Interfața aplicației și acest README GitHub sunt în **30 de limbi**. Schimbă în Setări (sau în antet) cu un selector nativ sau folosește linkurile de sus. Araba și ebraica merg de la dreapta la stânga. Confidențialitatea și termenii sunt traduși când există text juridic nativ; altfel, engleză. Linkurile vechi `/zh/` duc în continuare la chineza simplificată.

## Unelte

Ecranul principal grupează uneltele pe sarcini (pagini PDF, date, dezvoltare…) în loc de o listă plată.

### PDF
- Unește, împarte, organizează, numere de pagină
- Comprimă, blochează/deblochează, metadate, aplatizează
- Filigran, acoperire vizuală, semnătură tastată
- Extrage text, PDF → imagini ZIP, imagini → PDF

### Imagini
- Comprimă, redimensionează, decupează, rotește/oglindă, pachet favicon
- Ajustează, filtre, filigran
- Conversie JPEG/PNG/WEBP, vezi/elimină EXIF

### Audio și video
- Conversie, decupare cu undă, viteză/volum, extragere audio, clip → GIF  
  *(FFmpeg WASM; fișierele mari pot fi lente; codecuri limitate)*

### Date
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → interfețe TypeScript
- Hub de conversie

### Scriere
- Markdown ↔ HTML, comparare text, majuscule/minuscule, Lorem ipsum

### Dezvoltare
- Decodare JWT, marcaj de timp Unix, cron, bază numerică
- Hash (SHA/MD5), regex, culoare
- Base64, URL, entități HTML
- UUID, generator de parole, QR

## Confidențialitate

- Uneltele prelucrează datele **pe dispozitivul tău**
- Istoricul păstrează doar **rezumate** (nu conținutul fișierelor)
- Preferințele rămân în stocarea locală
- [Cum funcționează Kit](https://trykit.pages.dev/ro/how/) · [Politica de confidențialitate](https://trykit.pages.dev/ro/privacy/) · [Termeni de utilizare](https://trykit.pages.dev/ro/terms/)

## Dezvoltare locală

Cerințe: **Node.js 24+** (vezi `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Deschide http://localhost:3000 — limba implicită redirecționează spre `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Cale de bază

Pentru GitHub Pages de proiect, construiește cu:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Local nu există prefix (`NEXT_PUBLIC_BASE_PATH` gol).

## Publicare pe GitHub Pages

### Automat (recomandat)

1. Trimite acest depozit la **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Fluxul [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) construiește cu `NEXT_PUBLIC_BASE_PATH=/kit` și publică `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL Pages: `https://TGthms.github.io/kit/`  
Site canonic: `https://trykit.pages.dev`

## Tehnologie

Next.js 16 (App Router, export static) · TypeScript · Tailwind CSS · UI stil shadcn · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licență

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
