# Kit inventory and backlog

This file is the active backlog and implementation record. Do not use the disposable `out/` directory as source evidence. Current source is under `src/`, `messages/`, `content/`, `public/`, and `scripts/`.

Current baseline (2026-08-22): **57 tools**, Next.js 15 static-export PWA, 30 first-class locales plus the legacy `/zh/` path alias, localized tool metadata, sitemap/robots, Vitest coverage, and GitHub Pages CI. The canonical production site is `trykit.pages.dev`; GitHub Pages at `/kit` is the backup deployment.

Completed in the current correctness pass:

- FFmpeg trim and GIF clipping now use explicit `start` + `duration` semantics and re-encode instead of relying on container stream-copy timing.
- MP4/MOV/MKV conversion uses explicit H.264/AAC transcoding; silent-video speed processing has a video-only fallback.
- History summaries and options are sanitized so filenames, watermark text, ranges, and arbitrary free-form values are not persisted.
- PDF watermark, page-number, and signature rendering can use browser Unicode text rendering for non-Latin input.
- Media waveform decoding skips files over 100 MB to avoid freezing the tab.
- Image download extensions are derived from the resulting Blob MIME type.
- PDF organize now has drag-and-drop page reordering.
- PDF.js documents are explicitly destroyed after normal processing.
- Privacy Policy and Terms files now exist for all 31 path locales (62 documents total); legal-loading tests cover every first-class locale.
- SQL comments and non-identifier JSON keys are preserved; invalid HTML entity code points no longer crash decoding.

Everyday Tools implementation started (2026-08-24):

- Added the new Everyday category and registered Everyday Converter, Text Counter, Time Zone Converter, Date Calculator, Tip & Split Calculator, Stopwatch / Timer, Random Generator, plus the promoted Image → PDF quick tool, QR Code, and Password Generator.
- Added pure converter engines and tests under `src/lib/converter/` for local units, Frankfurter rates/cache validation, Unicode text metrics, time zones, dates, tips/splits, random generation, and timer state.
- Added responsive client views under `src/components/tools/everyday-tools.tsx` with category landing, currency cache fallback, world clock, calculators, timer, random modes, and local image-to-PDF assembly.
- Added localized message keys across all 31 catalogs and updated all 62 legal documents with Frankfurter currency-rate disclosure.
- Current validation: typecheck, lint, and 83 Vitest tests pass.

Remaining entries below should be reviewed against the current source before implementation because parts of this historical inventory predate the current registry and feature set.

---

## (a) Missing features per tool category

### PDF (7 tools: merge, split, organize, compress, watermark, redact, extract)

| Gap | Notes from current code |
| --- | --- |
| Page numbering | No stamp of `{n}` / `{n} / {total}` on pages. |
| PDF → image ZIP | `pdf-extract` image mode rasters **page 1 only** via `renderPdfThumbnail` and writes a comment that XObject extract is limited. |
| Image → PDF | Missing. Convert hub handles image mime convert, not PDF assembly. |
| Password lock / unlock | `PDFDocument.load(..., { ignoreEncryption: true })` everywhere. pdf-lib cannot encrypt or decrypt. Genuine lock/unlock needs a new client-side lib (`@cantoo/pdf-lib` or similar) or must stay blocked with an honest disclosure. |
| Form-field flatten | No `getForm()` / `flatten()` path. |
| Metadata edit / strip | No title/author/subject/keywords/creator/producer UI. Image metadata is the only metadata tool, and it only strips. |
| OCR for scanned pages | Not present. `extractPdfText` is pdf.js text-layer only. Client-side OCR (Tesseract.js + trained data) is a large extra download that would break the static PWA size bar — **defer**. Digital-PDF extract stays as-is. |
| Batch | Merge, compress, watermark, and page-numbers accept multiple files (ZIP when count > 1). Split / organize / redact / extract stay single-file by nature. |
| Redact UX | Hard-coded center band box; no draw-to-redact. Visual cover only (already disclosed). |

### Image (6 tools: compress, resize, crop, convert, metadata, adjust)

| Gap | Notes |
| --- | --- |
| EXIF **viewer** | `image-metadata` only calls `stripMetadata` → re-encode via canvas. No tag table (camera, date, GPS, orientation). |
| Rotate / flip | Missing as a dedicated transform (organize-PDF has rotate; images do not). |
| Simple filters | Adjust is brightness/contrast/saturation only. No grayscale / sepia / invert. |
| Favicon / multi-size icon export | Missing. |
| Batch | Compress / resize / convert / metadata / adjust already accept multiple files. Crop is single-file by nature (one region). Resize/convert download many files individually instead of a ZIP when count > 1 (compress already zips). |
| Crop UX | Numeric x/y/w/h only — no visual crop handle. |

### Audio (3) / Video (4)

| Gap | Notes |
| --- | --- |
| Format / codec coverage | Audio: mp3 / wav / ogg. Video: mp4 / webm. No AAC / FLAC / M4A / GIF / MOV listed. |
| Waveform preview | None. |
| Trim-by-drag | Trim is two numeric timestamp fields (`start`/`end` strings). No drag handles. |
| GIF from video clip | Missing. |
| Progress / cancel | Convert, trim, speed, extract-audio, and GIF show progress and can abort (FFmpeg `terminate`). |
| Batch | Convert accepts multiple files (sequential + ZIP). Trim / speed / GIF stay one timeline. |

### Convert hub (1)

- Pair matrix is narrow (json/yaml/csv/zip/image). No XML. Unsupported pairs throw a generic English `"Unsupported conversion pair"`.

### Text & data (8: json, yaml, toml, md↔html, csv↔json, diff, base64, url)

Missing expected utilities:

- XML ↔ JSON
- SQL formatter
- Regex tester
- Hash generator (SHA family + MD5)
- UUID generator
- Color converter / picker
- Lorem ipsum
- QR generate **and** read

TOML “format” only validates and returns trimmed original (`formatToml`).

---

## (b) UX / experience friction

- **Single-file defaults** on tools users expect to batch (PDF watermark/compress, AV convert).
- **Drop / paste / keyboard** live on `FileDropzone` (`onPaste`, Enter/Space). Text tools have no file drop (fine). Dropzone `role="button"` has no `aria-label`; remove button is labeled; star favorite is labeled.
- **No global Run shortcut** wired (`shortcuts.run` string exists; `ShortcutsProvider` never binds it).
- **Image extract** surprise: “Images” on PDF extract is page 1 raster, not embedded images / all pages.
- **Redact** is a fixed rectangle, easy to misunderstand as real sanitization (note exists).
- **AV trim** without waveform or duration — users guess seconds.
- **Large files**: `common.fileTooLarge` exists but is unused. No size warning, no cancel, long FFmpeg jobs can look frozen.
- **How-it-works / limits**: only compress + redact + AV convert have notes. Missing on extract-images, metadata strip (lossy re-encode), lock (when added), GIF, hashes.
- **Crop / redact** lack visual preview.
- **Convert hub** error copy is English-only.
- **History** stores summaries only (good). No per-tool deep link from options.
- **iOS back** is already on tool / settings / history / legal via `PageHeader`. Keep that contract for every new submenu.

---

## (c) Technical gaps

| Area | Current state |
| --- | --- |
| SEO | Root `src/app/layout.tsx` has a generic title/description. Tool routes have **no** `generateMetadata`. No `sitemap.xml` / `robots.txt`. All 29 tools × 4 locales share the site title. |
| Testing | No Vitest/Jest. Zero `*.test.ts`. Riskiest logic (`parsePageRange`, conversions, future EXIF) is untested. |
| Error boundaries | No `not-found.tsx` (locale-aware). No `error.tsx` on `[locale]` or `tools/[toolId]`. Unknown tool ids call `notFound()` but the UI is the default Next 404. |
| Accessibility | Focus rings exist on `Button`. Icon-only close on shortcuts overlay is `×` without `aria-label`. Dropzone keyboard works. Contrast relies on shadcn tokens — needs a light/dark pass. |
| Large-file / cancel | FFmpeg jobs accept AbortSignal and terminate the engine. PDF compress checks cancel between pages via `forEachJobIndex`. |
| Metadata / OG | No per-tool OG tags sourced from i18n. |
| README / deploy URL | README still advertises `https://TGthms.github.io/kit/` as the live site. Product context says live is `https://trykit.pages.dev`. |
| Privacy | Processing is client-side. pdf.js worker + ffmpeg-core load from jsDelivr (engine, not user files). New tools must not POST file bytes. |
| OCR | **Deferred** — not feasible without a heavy local engine. |

---

## Prioritized backlog (maps to plan tiers)

### Tier A — ship

1. PDF: page numbers; per-page image ZIP; images → PDF; flatten forms; metadata view/edit/strip; lock/unlock if a real in-browser lib works (else disclose blocked).
2. Image: EXIF viewer (keep strip); rotate/flip; filters; favicon export; ZIP batch on remaining multi-file image jobs.
3. AV: more formats on existing ffmpeg-wasm; waveform + drag-trim; GIF from clip; codec-limit disclosure; cancel + progress.
4. Text: XML↔JSON, SQL format, regex tester, SHA/MD5, UUID, color, lorem, QR generate/read.
5. Batch + consistent drop/paste/keyboard on file tools.
6. Per-tool `generateMetadata` × 4 locales; `sitemap.xml`; `robots.txt`; how-it-works disclosures.

### Tier B — floor

1. Vitest on `src/lib` (PDF, image transforms/EXIF, text).
2. Locale `not-found` + route `error`.
3. Large-file warning, progress, cancel, toast on failure.
4. A11y: dropzone name, icon buttons, focus, contrast.

### Deferred (documented, not fake-shipped)

- Client-side OCR (engine size).
- True sanitizing redaction (content-stream erase).
- Visual crop handles / draw-to-redact (nice; not gating).
- Replacing pdf.js / ffmpeg CDN engine loads.
- Tier C: usage stats, shareable presets, onboarding tour.
