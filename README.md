# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Everyday tools in the browser. Private by design.**

Kit is a high-quality, client-side utility toolkit for PDF, images, audio/video, converters, and text/data. Processing runs in your browser—files are not uploaded to a Kit server.

**Live (project Pages):** https://TGthms.github.io/kit/

**About the author:** https://tgthms.github.io/about/

## Vision

A cohesive, iOS-inspired toolkit that feels complete and polished: clear layout, light/dark mode, multi-language UI, offline-capable PWA shell, and honest limits for browser-based processing.

## Languages

UI and legal pages: **English · Español · 中文 · 日本語**

## Tools

### PDF
- Merge (thumbnails + reorder)
- Split, Organize (rotate/delete/reorder)
- Compress (lossy page re-encode)
- Watermark / header / footer
- Redact (visual cover—see in-app note)
- Extract text / page images

### Image
- Compress, Resize, Crop
- Format convert (JPEG / PNG / WEBP)
- Strip metadata
- Adjust (brightness / contrast / saturation)

### Audio & Video
- Format convert, Trim, Speed & volume, Extract audio  
  *(FFmpeg WASM, single-threaded; large files may be slow)*

### Converters
- Smart Convert hub (JSON/YAML/CSV/ZIP/images)

### Text & Data
- JSON / YAML / TOML format & validate
- Markdown ↔ HTML, CSV ↔ JSON
- Text diff, Base64, URL encode/decode

## Privacy

- Tools process data **on your device**
- History stores **metadata only** (not file contents)
- Preferences stay in local storage
- [Privacy Policy](https://TGthms.github.io/kit/en/privacy/) · [Terms of Use](https://TGthms.github.io/kit/en/terms/)

## Local development

Requirements: **Node.js 20+** (see `.nvmrc`).

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

Site URL: `https://TGthms.github.io/kit/`

## Tech stack

Next.js 15 (App Router, static export) · TypeScript · Tailwind CSS · shadcn-style UI · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA service worker

## License

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
