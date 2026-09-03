# Kit inventory and backlog

This file is the active implementation record. Current source is under `src/`, `messages/`, `content/`, `public/`, and `scripts/`. Do not use the disposable `out/` directory as source evidence.

## Current baseline (2026-08-29)

- **94 tools** in `src/lib/tools/registry.ts`.
- Next.js 16 App Router with static export, PWA shell, Cloudflare Pages (canonical) and GitHub Pages CI. GitHub Actions runs typecheck, lint, and tests before the Pages backup publish.
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
- PDF.js documents are explicitly destroyed after normal processing. Raster and text extract cap at the first 200 pages and warn when a file is longer.
- Privacy Policy and Terms exist for all 31 path locales; legal-loading tests cover every first-class locale.
- SQL comments and non-identifier JSON keys are preserved; invalid HTML entity code points no longer crash decoding.
- Everyday category includes unit conversion, currency, text counting, time zones, meeting overlap, dates, tips/splits, percentage, loan/compound interest, BMI and calorie estimates, stopwatch/timer/pomodoro, and random generation. Images-to-PDF lives under PDF export.
- PDF page numbers, PDF-to-images ZIP, images-to-PDF, form flattening, PDF metadata, PDF lock/unlock, image EXIF inspection, rotate/flip, filters, favicon export, XML/JSON, SQL, regex, hashing, UUID, color, Lorem ipsum, QR, and password tools are registered and implemented.
- PDF merge thumbnails are rendered concurrently, while PDF-to-image processing still cleans up PDF.js documents.
- Images-to-PDF defaults to A4 fit-to-page with margins; the tool can switch to original image size. The engine keeps both modes.
- The everyday world-clock city list is maintained in `src/lib/converter/cities.ts` and uses IANA time zones through `Intl`.
- The static app includes an explicit CSP meta policy for same-origin assets plus Frankfurter. pdf.js and FFmpeg WASM are vendored under `public/vendor/` (synced on postinstall/prebuild). FFmpeg’s core WASM is shipped gzipped (`ffmpeg-core.wasm.gz`, ~10 MiB) because Cloudflare Pages rejects files over 25 MiB; the browser gunzips it before load. `@ffmpeg/core` is GPL-2.0-or-later (H.264 / LAME); Kit source stays MIT, and README / Terms / Privacy disclose the engine. Kit-owned boot scripts live in `public/boot/`. `'unsafe-inline'` remains because Next.js static export emits inline Flight payloads. Cloudflare `_headers` also sends CSP with `frame-ancestors 'none'`.
- Mobile tool headers collapse after scrolling to a compact iOS-like back affordance; tool title, description, client-side note, and favorite action are hidden while scrolled.
- Keyboard shortcuts avoid Cmd/Ctrl bindings that collide with macOS, Windows, and browser commands: `/` focuses search, `R` runs the active tool, `?` opens help, and `Esc` closes help. Cmd/Ctrl+Enter remains available as an optional form-style run gesture.
- Theme persists in localStorage (`theme` = applied value, `kit-theme-context` = user intent). System is the default. A header or Settings Light/Dark tap always paints that appearance immediately and keeps it for this visit, even when auto policy would force Dark. Auto policy still applies on boot (and on OS / 22:00 / 05:00 when the user has not tapped this visit): follow System by default; keep Dark; if the stored intent is Light while the OS is dark or it is night (22:00–04:59), force Dark (the Light intent is restored when that condition lifts). Light/dark switches use a circular View Transition wipe from the control (instant when View Transitions are missing or reduced motion is on).
- Countdown, stopwatch, world-clock faces, and live numeric results use Scritto (`@scritto/react`). The clock is one formatted `HH:MM:SS` string (colons stay; only changed glyphs roll). Running countdown uses `trend={-1}`; running stopwatch and world-clock ticks use `trend={+1}`; idle reads direction from the value. Centiseconds stay static so sub-second ticks do not stack ghosts. World-clock cards update once a second, inside Scritto’s duration window.
- Copy actions confirm on the button (icon + “Copied”); they no longer toast on success.
- Home Start here lists tools only (Currency first, BMI & calorie last). Everyday converters and Everyday tools are category pages, not featured cards.
- Text counter reading time is ~220 WPM for alphabetic text and ~400 characters/min for CJK, shown as `45s` / `1m 15s` rather than rounded-up minutes.
- Form fields use 16px type so iOS Safari does not zoom into converter search inputs on focus. The installed PWA also locks page pinch-zoom (`maximum-scale=1`) while still following iOS Dynamic Type via `-apple-system-body` (rem layout scales with Settings → Display & Text Size). Browser tabs stay pinch-zoomable.
- Mobile PWA tab bar is a floating glass capsule just above the home indicator (content scrolls underneath). The active tab and 2-item segments (timer mode, appearance) use a gliding pill; switches use a short overshoot on the thumb. The document scroller keeps native rubber-band bounce at the top and bottom; overscroll is not locked in the installed PWA.
- Cover content is a drawable visual overlay (not true redaction). Shrink-as-images rasterizes pages to JPEG and says so in the tool name and limits.
- World clock public URL is `/tools/world-clock/`; `/tools/timezone-converter/` still loads the same tool and rewrites the path.
- Images → PDF defaults to A4 fit with an original-size option. JPEG EXIF orientation is applied via canvas decode.
- pdf.js CMaps, standard fonts, WASM, and ICC profiles are vendored next to the worker (`scripts/sync-vendor.mjs`).

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

- True content-stream redaction; current cover is visual-only and is disclosed as such.
- OCR for scanned PDFs; deferred because a client-side OCR engine would add a large download.
- More codec-specific validation and clearer unsupported-format errors for FFmpeg WASM.

### Engineering

- Add focused React tests for the remaining high-risk tool flows and accessibility behavior.
- Replace hard-coded file-tool classification with an explicit registry property.
- Hash-based `script-src` (dropping `'unsafe-inline'`) is blocked by Next.js Flight inline scripts on static export.

### Explicitly deferred

- Client-side OCR.
- True sanitizing redaction.
- Usage statistics, shareable presets, and onboarding tours.
