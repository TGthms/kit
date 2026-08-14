# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Toate cele 30 de limbi ale README</summary>

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
- [Norsk Bokmål](README.nb.md)
- [Suomi](README.fi.md)
- [Polski](README.pl.md)
- [Čeština](README.cs.md)
- [Magyar](README.hu.md)
- **Română**
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

**Unelte de zi cu zi în browser. Private prin concepție.**

Kit este un set de unelte PDF, imagine, media, conversie și text care rulează pe dispozitivul tău. Prelucrarea rămâne în browser — nimic nu este trimis către un server Kit.

**Site:** https://trykit.pages.dev

**Despre autor:** https://tgthms.github.io/about/

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
- [Politica de confidențialitate](https://trykit.pages.dev/ro/privacy/) · [Termeni de utilizare](https://trykit.pages.dev/ro/terms/)

## Dezvoltare locală

Cerințe: **Node.js 22.13+** (vezi `.nvmrc`).

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
3. Fluxul [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) construiește cu `NEXT_PUBLIC_BASE_PATH=/kit` și publică `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL Pages: `https://TGthms.github.io/kit/`  
Site canonic: `https://trykit.pages.dev`

## Tehnologie

Next.js 15 (App Router, export static) · TypeScript · Tailwind CSS · UI stil shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licență

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
