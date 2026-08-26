# Kit

**English** · [Español](docs/readme/es.md) · [Français](docs/readme/fr.md) · [Deutsch](docs/readme/de.md) · [Português (Brasil)](docs/readme/pt-BR.md) · [日本語](docs/readme/ja.md) · [简体中文](docs/readme/zh-Hans.md) · [繁體中文](docs/readme/zh-Hant.md) · [한국어](docs/readme/ko.md) · [العربية](docs/readme/ar.md)

<details>
<summary>All 30 README languages</summary>

- **English**
- [Español](docs/readme/es.md)
- [Français](docs/readme/fr.md)
- [Deutsch](docs/readme/de.md)
- [Italiano](docs/readme/it.md)
- [Português (Brasil)](docs/readme/pt-BR.md)
- [Português (Portugal)](docs/readme/pt-PT.md)
- [Nederlands](docs/readme/nl.md)
- [Dansk](docs/readme/da.md)
- [Svenska](docs/readme/sv.md)
- [Norsk Bokmål](docs/readme/nb.md)
- [Suomi](docs/readme/fi.md)
- [Polski](docs/readme/pl.md)
- [Čeština](docs/readme/cs.md)
- [Magyar](docs/readme/hu.md)
- [Română](docs/readme/ro.md)
- [Ελληνικά](docs/readme/el.md)
- [Türkçe](docs/readme/tr.md)
- [Русский](docs/readme/ru.md)
- [Українська](docs/readme/uk.md)
- [العربية](docs/readme/ar.md)
- [עברית](docs/readme/he.md)
- [हिन्दी](docs/readme/hi.md)
- [ไทย](docs/readme/th.md)
- [Tiếng Việt](docs/readme/vi.md)
- [Bahasa Indonesia](docs/readme/id.md)
- [日本語](docs/readme/ja.md)
- [한국어](docs/readme/ko.md)
- [简体中文](docs/readme/zh-Hans.md)
- [繁體中文](docs/readme/zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Everyday tools in your browser. Private by design.**

Kit is a set of PDF, image, media, converter, and text tools that run on your device. Processing stays in the browser—nothing is uploaded to a Kit server.

**Live site:** https://trykit.pages.dev

**About the author:** https://t-g.pages.dev

## What you get

A complete, polished toolkit: 65 tools, clear layout, light and dark appearance, a 30-language UI with a native picker, an installable PWA shell, and honest limits about what a browser can do.

## Languages

The app interface and this GitHub README are available in **30 languages**. Switch in Settings (or the header) with a native picker, or use the links at the top of this file. Translations live in [`docs/readme/`](docs/readme/). Included: English, Español, Français, Deutsch, Italiano, Português (Brasil / Portugal), Nederlands, Dansk, Svenska, Norsk Bokmål, Suomi, Polski, Čeština, Magyar, Română, Ελληνικά, Türkçe, Русский, Українська, العربية, עברית, हिन्दी, ไทย, Tiếng Việt, Bahasa Indonesia, 日本語, 한국어, 简体中文, and 繁體中文. Arabic and Hebrew use right-to-left layout. Privacy and Terms are localized where we have native legal text; other locales fall back to English. Old `/zh/` app links still resolve to Simplified Chinese.

## Tools

The home screen groups tools by job (PDF pages vs markup, developer inspect vs encode) instead of one flat dump.

### PDF
- Merge, split, organize, page numbers
- Compress, lock/unlock, metadata, flatten
- Watermark, visual redact, typed signature stamp
- Extract text, PDF → images ZIP, images → PDF

### Images
- Compress, resize, crop, rotate/flip, favicon pack
- Adjust, filters, image watermark
- Convert JPEG/PNG/WEBP, view/strip EXIF

### Audio & Video
- Convert, trim with waveform, speed/volume, extract audio, clip → GIF  
  *(FFmpeg WASM; large files may be slow; limited codecs)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript interfaces
- Smart convert hub

### Writing
- Markdown ↔ HTML, text diff, case convert, Lorem ipsum

### Developer
- JWT decode, Unix timestamp, cron explainer, number base
- Hash (SHA/MD5), regex, color
- Base64, URL, HTML entities
- UUID, password generator, QR generate/read

## Privacy

- Tools process data **on your device**
- History stores **metadata only** (not file contents)
- Preferences stay in local storage
- [Privacy Policy](https://trykit.pages.dev/en/privacy/) · [Terms of Use](https://trykit.pages.dev/en/terms/)

## Local development

Requirements: **Node.js 22.13+** (see `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Open http://localhost:3000 — default locale redirects to `/en/`.

```bash
npm run build      # static export → out/
npm run typecheck
npm run lint
```

### Base path

For GitHub project pages, build with:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Local default uses no base path (`NEXT_PUBLIC_BASE_PATH` empty).

## Deploy to GitHub Pages

### Automatic (recommended)

1. Push this repo to **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. The workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds with `NEXT_PUBLIC_BASE_PATH=/kit` and deploys the `out/` folder

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

GitHub Pages URL: `https://TGthms.github.io/kit/`  
Canonical live site: `https://trykit.pages.dev`

## Tech stack

Next.js 15 (App Router, static export) · TypeScript · Tailwind CSS · shadcn-style UI · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA service worker

## License

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
