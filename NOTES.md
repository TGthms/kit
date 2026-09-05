# Kit inventory and backlog

This file is the active implementation record. Current source is under `src/`, `messages/`, `content/`, `public/`, and `scripts/`. Do not use the disposable `out/` directory as source evidence.

## Current baseline (2026-08-29)

- **94 tools** in `src/lib/tools/registry.ts`.
- Next.js 16 App Router with static export, PWA shell, Cloudflare Pages (canonical) and GitHub Pages CI. GitHub Actions runs typecheck, lint, and tests before the Pages backup publish.
- Cloudflare Pages Free allows 20,000 files per deploy. Next 16 writes extra `__next.*.txt` segment-prefetch files per route (~23k files for 31 locale URLs). `scripts/prune-export.mjs` runs as `postbuild` and deletes those extras, keeping `index.html` and `index.txt` so client navigations still work. Cloudflare clones GitHub and runs `npm run build`; it does not upload the gitignored local `out/` folder.
- 30 first-class locales plus the legacy `/zh/` path alias; localized tool metadata, sitemap, robots, and 62 legal documents.
- Pure engines and tests under `src/lib/`; client tool views under `src/components/tools/`; favorites and metadata-only history in Zustand stores.
- Canonical production site: `https://trykit.pages.dev`; GitHub Pages backup: `https://TGthms.github.io/kit/`.
- PWA shell cache is `kit-shell-v9`. The worker never returns a redirect `Response` or a `fetch()` result with `redirected: true` (Safari: “Response served by service worker has redirections”). Document navigations to `.txt` fetch the HTML route instead. After idle, a hung navigate fetch falls back to cached HTML at 2.5s without waiting for abort. After first paint the worker silently fills JS/CSS, chrome HTML for every locale, and all tools plus pdf.js/FFmpeg for the locale in use. Fills use low-priority fetches and pause on pointer/key/wheel so interaction feels identical to no fill. FFmpeg is skipped on Save-Data or 2G. Offline in-app clicks load cached HTML documents (RSC cannot work offline). This is full offline for the language you have open, not a 30-locale download of every tool on first visit.
- After a deploy, a tab that still names deleted hashed chunks reloads once (`ChunkLoadError` / failed dynamic import). Retry on the error screen does the same. A 10s guard stops a reload loop.
- Locale documents bake `lang` and `dir` on `<html>` (`/ar/` is `lang="ar" dir="rtl"`). `/` stays an English LocaleGate. The boot locale-lang script remains a backup (`zh` → `zh-Hans`).

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
- Everyday category includes unit conversion, currency, text counting, time zones, meeting overlap, dates, tips/splits, percentage, loan/compound interest, BMI and calorie estimates, stopwatch/countdown, and random generation. Images-to-PDF lives under PDF export.
- PDF page numbers, PDF-to-images ZIP, images-to-PDF, form flattening, PDF metadata, PDF lock/unlock, image EXIF inspection, rotate/flip, filters, favicon export, XML/JSON, SQL, regex, hashing, UUID, color, Lorem ipsum, QR, and password tools are registered and implemented.
- PDF merge thumbnails are rendered concurrently, while PDF-to-image processing still cleans up PDF.js documents.
- Images-to-PDF defaults to A4 fit-to-page with margins; the tool can switch to original image size. The engine keeps both modes.
- The everyday world-clock city list is maintained in `src/lib/converter/cities.ts` and uses IANA time zones through `Intl`.
- The static app includes an explicit CSP meta policy for same-origin assets plus Frankfurter. pdf.js and FFmpeg WASM are vendored under `public/vendor/` (synced on postinstall/prebuild). FFmpeg’s core WASM is shipped gzipped (`ffmpeg-core.wasm.gz`, ~10 MiB) because Cloudflare Pages rejects files over 25 MiB; the browser gunzips it before load. `@ffmpeg/core` is GPL-2.0-or-later (H.264 / LAME); Kit source stays MIT, and README / Terms / Privacy disclose the engine. Kit-owned boot scripts live in `public/boot/`. `'unsafe-inline'` remains because Next.js static export emits inline Flight payloads. Cloudflare `_headers` also sends CSP with `frame-ancestors 'none'`.
- Mobile tool headers collapse after scrolling to a compact iOS-like back affordance; tool title, description, client-side note, and favorite action are hidden while scrolled.
- Keyboard shortcuts avoid Cmd/Ctrl bindings that collide with macOS, Windows, and browser commands: `/` focuses search, `R` runs the active tool, `?` opens help, and `Esc` closes help. Cmd/Ctrl+Enter remains available as an optional form-style run gesture.
- Theme persists in localStorage (`theme` = applied value, `kit-theme-context` = user intent). System is the default until the user taps Light or Dark. Settings appearance is Light and Dark only (no Match system control); the auto-follow policy still runs. A header or Settings Light/Dark tap always paints that appearance immediately and keeps it for this visit, even when auto policy would force Dark. Auto policy still applies on boot (and on OS / 22:00 / 05:00 when the user has not tapped this visit): follow System by default; keep Dark; if the stored intent is Light while the OS is dark or it is night (22:00–04:59), force Dark (the Light intent is restored when that condition lifts). Light/dark switches use a circular View Transition wipe from the control (instant when View Transitions are missing or reduced motion is on).
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
- Home greetings pair the subtitle with the main line (Kit/privacy → Kit-knowledge facts; productivity → workflow facts; time-of-day → general facts plus period flavor). Monday morning and Friday afternoon/evening/night add extra main lines; weekends add a third weekend line. Observances still win the calendar day. Current holidays keep three distinct subtitles each; Good Friday’s subtitle is always John 19:30 from the World English Bible (public domain, stored in `src/lib/home/verses.ts`, never translated, hidden with other Christian days for `ar` / `he` / `hi`). Six further tech/internet days: Data Privacy Day (28 Jan), World Emoji Day (17 Jul), Software Freedom Day (3rd Saturday of September), Global Encryption Day (21 Oct), International Internet Day (29 Oct), World Digital Preservation Day (first Thursday of November). The sub-greeting uses opacity-only CSS (`fade` / slower `fadeSlow` for evening, night, and solemn days) at the same time as the main line; reduced motion shows both lines immediately. Simplified and Traditional Chinese greeting catalogs were rewritten natively (not translated); Japanese and Korean were polished (no “mode on” calques; Korean New Year label is 신정, not 설날).
- Hidden greeting preview, production included: `/{locale}/?greetingDate=YYYY-MM-DD` uses that calendar day at the current clock hour. Optional `time=HH:MM` or `time=HH:MM:SS` (alias `greetingTime`) pins the clock; the preview then advances so a New Year flip can be watched. Optional `greetingSeed=integer` pins the pair. Invalid values are ignored. Examples: `/en/?greetingDate=2026-12-25`, `/en/?greetingDate=2026-12-31&time=23:59:03`, `/zh-Hans/?greetingDate=2026-03-14&greetingSeed=3`. Good Friday 2026 is `2026-04-03`.
- New Year card (local Gregorian midnight): appears 10 minutes before 1 Jan, counts down with Scritto `MM:SS`, then shows “Happy New Year!” for the rest of 1 Jan. The card ticks the clock locally so home does not re-render 4×/s. A tab left open on 31 Dec wakes at 23:50; greeting period changes on 1 Jan still run under the card. The card is the `h1` and shows on category pages too; the time-of-day line is `h2` while the card is up and does not also use `greeting.observance.newYear`. Countdown subtitle follows remaining time (`{minutes}` / one minute / a few seconds). Full-screen `fireworks-js` `start()` runs for the remainder of the first 10 seconds after the flip (or if the tab opens in that window); do not call `launch()` (that one-shots then `waitStop`). Reduced motion skips fireworks and digit rolls.
- Tool routes omit `home.greeting` / `subtitleFacts` / `subtitleObservance` / `newYearCard` from the client message payload. Home still ships those strings.

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
