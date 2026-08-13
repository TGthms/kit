# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Everyday tools in your browser. Private by design.**

Kit is a set of PDF, image, media, converter, and text tools that run on your device. Processing stays in the browser—nothing is uploaded to a Kit server.

**Live site:** https://trykit.pages.dev

**About the author:** https://tgthms.github.io/about/

## What you get

A complete, polished toolkit: clear layout, light and dark appearance, full multi-language UI, an installable PWA shell, and honest limits about what a browser can do.

## Languages

Interface and legal pages: **English · Español · 中文 · 日本語**

## Tools

### PDF
- Merge (thumbnails + reorder)
- Split, Organize (rotate/delete/reorder)
- Compress (lossy page re-encode)
- Watermark / header / footer
- Redact (visual cover—see in-app note)
- Extract text / all-page image ZIP
- Page numbers
- PDF → images (per-page ZIP) and Images → PDF
- Flatten form fields
- Metadata view / edit / strip
- Lock or unlock with a password (client-side)

### Image
- Compress, Resize, Crop
- Format convert (JPEG / PNG / WEBP)
- View EXIF and strip metadata
- Adjust (brightness / contrast / saturation)
- Rotate / flip, simple filters
- Favicon / multi-size icon export

### Audio
- Convert (MP3 / WAV / OGG / AAC / FLAC / M4A), Trim with waveform, Speed & volume  
  *(FFmpeg WASM; large files may be slow; limited codecs)*

### Video
- Convert (MP4 / WEBM / GIF / MOV / MKV), Trim with waveform, Speed & volume, Extract audio, Clip → GIF  
  *(FFmpeg WASM; large files may be slow; limited codecs)*

### File convert
- Smart convert hub (JSON, YAML, CSV, ZIP, images…)

### Text & Data
- JSON / YAML / TOML format & validate
- Markdown ↔ HTML, CSV ↔ JSON, XML ↔ JSON
- SQL formatter, regex tester
- Text diff, Base64, URL encode/decode
- Hash (SHA / MD5), UUID, color converter, Lorem ipsum, QR generate / read

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
