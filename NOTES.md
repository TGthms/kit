# Kit inventory and backlog

This file is the active implementation record. Current source is under `src/`, `messages/`, `content/`, `public/`, and `scripts/`. Do not use the disposable `out/` directory as source evidence.

## Current baseline (2026-08-25)

- **65 tools** in `src/lib/tools/registry.ts`.
- Next.js 15 App Router with static export, PWA shell, and GitHub Pages CI.
- 30 first-class locales plus the legacy `/zh/` path alias; localized tool metadata, sitemap, robots, and 62 legal documents.
- Pure engines and tests under `src/lib/`; client tool views under `src/components/tools/`; favorites and metadata-only history in Zustand stores.
- Canonical production site: `https://trykit.pages.dev`; GitHub Pages backup: `https://TGthms.github.io/kit/`.

## Completed correctness and product work

- FFmpeg trim and GIF clipping use explicit `start` + `duration` semantics and re-encode instead of relying on container stream-copy timing.
- MP4/MOV/MKV conversion uses explicit H.264/AAC transcoding; silent-video speed processing has a video-only fallback.
- History summaries and options are sanitized so filenames, watermark text, ranges, and arbitrary free-form values are not persisted.
- PDF watermark, page-number, and signature rendering can use browser Unicode text rendering for non-Latin input.
- Media waveform decoding skips files over 100 MB to avoid freezing the tab.
- Image download extensions are derived from the resulting Blob MIME type.
- PDF organize supports drag-and-drop page reordering.
- PDF.js documents are explicitly destroyed after normal processing.
- Privacy Policy and Terms exist for all 31 path locales; legal-loading tests cover every first-class locale.
- SQL comments and non-identifier JSON keys are preserved; invalid HTML entity code points no longer crash decoding.
- Everyday category includes unit conversion, currency, text counting, time zones, dates, tips/splits, stopwatch/timer, random generation, and local image-to-PDF assembly.
- PDF page numbers, PDF-to-images ZIP, images-to-PDF, form flattening, PDF metadata, PDF lock/unlock, image EXIF inspection, rotate/flip, filters, favicon export, XML/JSON, SQL, regex, hashing, UUID, color, Lorem ipsum, QR, and password tools are registered and implemented.
- PDF merge thumbnails are rendered concurrently, while PDF-to-image processing still cleans up PDF.js documents.
- Images-to-PDF now supports an A4 fit-to-page layout with margins; the tool uses it by default while the pure engine retains an explicit natural-size mode.
- The everyday world-clock city list is maintained in `src/lib/converter/cities.ts` and uses IANA time zones through `Intl`.
- The static app includes an explicit CSP meta policy for same-origin assets plus the documented jsDelivr and Frankfurter origins. SRI is not used for dynamically loaded WASM/blob URLs.
- Mobile tool headers collapse after scrolling to a compact iOS-like back affordance; tool title, description, client-side note, and favorite action are hidden while scrolled.
- Keyboard shortcuts avoid Cmd/Ctrl bindings that collide with macOS, Windows, and browser commands: `/` focuses search, `R` runs the active tool, `?` opens help, and `Esc` closes help. Cmd/Ctrl+Enter remains available as an optional form-style run gesture.
- Theme behavior intentionally resets to System on every fresh mount/reload. Manual light/dark choices apply for the current visit only.

## Validation baseline

The expected validation sequence is:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Component tests use the browser-like Vitest environment where needed; pure libraries remain covered in the Node environment.

## Remaining backlog

### Product / UX

- True content-stream redaction; current redaction is a visual cover and is disclosed as such.
- OCR for scanned PDFs; deferred because a client-side OCR engine would add a large download.
- Visual crop handles and draw-to-redact interactions.
- More file-tool batch defaults and consistent progress/cancel messaging.
- Optional user-selectable PDF page sizes beyond the current A4 fit-to-page default.
- More codec-specific validation and clearer unsupported-format errors for FFmpeg WASM.

### Engineering

- Add focused React tests for the remaining high-risk tool flows and accessibility behavior.
- Consider moving the large everyday tool view into smaller feature modules as more functionality is added.
- Replace hard-coded file-tool classification with an explicit registry property.
- Add a CSP HTTP response header at the hosting layer where the deployment platform allows it; the static export currently supplies the policy through `<meta>`.
- Continue auditing third-party CDN loading and pin versions whenever upstream artifacts change.

### Explicitly deferred

- Client-side OCR.
- True sanitizing redaction.
- Replacing pdf.js / FFmpeg CDN engine loads with bundled workers.
- Usage statistics, shareable presets, and onboarding tours.
