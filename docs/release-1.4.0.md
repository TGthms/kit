# Kit 1.4.0

Approved audit release, 2026-11-11. The scope covers the existing 100 tools.
Statistics, matrix/system tools and archive extraction were explicitly deferred.

## Output correctness

- JSON conversions refuse decimal literals that would change on a JavaScript
  number round trip. Large IDs, overflow and underflow cannot silently become
  another number or null. Quoting such values retains them exactly.
- YAML conversion checks input/structure budgets and refuses unsafe integers or
  non-finite values. Smart convert runs document parsing in a terminating local
  worker with an eight-second deadline and source-owned cancellation.
- SQL formatting preserves dollar-quoted strings, multiline literal whitespace
  and bracketed identifiers. Identifier case styles retain Unicode letters and
  combining marks and separate acronym boundaries.
- Cron fields validate bounds, lists, ranges and steps. The UI presents localized
  allowed values, the scheduler time-zone boundary and the day-field OR rule.
- PDF compression preserves physical page dimensions independently of JPEG
  resolution. Documents over 200 pages are refused rather than exported as a
  truncated compressed document. Other explicitly limited raster/extraction
  tools keep their existing page-limit disclosure.
- Graph sampling adapts within a fixed work budget. Off-center probes detect
  regular-grid aliasing; unresolved intervals break instead of inventing lines,
  and the workspace reports the detail limit.

## Workflows and appearance

- Shared file jobs invalidate late results/errors/progress on input changes,
  cancellation and unmount. File processing exposes reusable results instead of
  automatic downloads. Explicit Download, supported Share and local handoff
  retain their existing privacy boundaries.
- Image workspaces put options beside original/result previews on wide screens.
  Text formatters/converters preserve editable input beside a separate output
  with copy/download. Processing failures remain visible in the workspace.
- Mobile Start here keeps the approved order, with four compact initial tiles
  and an expandable remainder. Tool FAQs are secondary native disclosures.
- Saved graphs live in a toolbar dialog. Portable versioned graph JSON imports
  into the saved library first and does not implicitly overwrite active work.
- Timestamp units are explicit (automatic, seconds, milliseconds, microseconds,
  nanoseconds). CSV export protects spreadsheet formulas by default, with an
  explicit raw option.
- Appearance offers System, Light and Dark. Night appearance remains enabled by
  default for 22:00–05:00. The setting explains that a direct appearance tap is
  honored until the next launch. Explicit daytime Light no longer follows an
  unrelated OS-dark force. Preferences transfer includes the optional new flag
  while preserving older exports.
- Light navigation/muted text and filled actions use contrast-safe colors.
  Both Classic and Liquid Glass remain supported.

## Payload and offline changes

- Client catalogs are scoped to chrome, Settings, How and individual tools.
  Search cards remain available across navigation, while tool routes avoid
  embedding all other tools' UI copy.
- An inline pre-hydration script registers the current device's four native
  startup-image links. Image URLs, dimensions, appearances, orientations and
  artwork remain unchanged. This avoids serializing all 68 device permutations
  repeatedly in HTML and Flight. All supported profiles have geometry/link tests.
  [Client-side startup-image links](https://web.dev/learn/pwa/enhancements)
- Build-time dependency tracing follows the exported Turbopack lazy-load
  branches for all 100 tools. Unknown boundaries fail the production build.
  Selected downloads include each tool's actual code plus required PDF/media
  assets and optional math runtime. A PDF-only collection excludes the media
  engine; unrelated math assets remain optional. Older manifests retain their
  complete-core/engine contract during updates.
- Runtime assets have release integrity checks. Readiness checks the selected
  dependencies, and removal retains assets shared with surviving tools.
- The export has a hard 1,000,000,000-byte release gate. Existing per-route gzip
  ceilings remain unchanged. The local export decreased from approximately
  1.90 GB to 0.935 GB; shared core assets decreased from 12.7 MB to 3.1 MB.
  These are file sizes, not real-device launch-time measurements.

## Engineering and verification

The job controller, offline status presentation, dependency tracing and numeric
sampling have explicit boundaries. Document workers are generated with pinned
esbuild because the current Next/Turbopack URL-worker path emitted raw TypeScript.
The local export server now serves PDF worker .mjs files as JavaScript, enabling
real PDF processing in browser tests.

Development-only dependency maintenance updates the TypeScript ESLint patch
release and scopes patched minimatch 11.0.1 to that package's dependency tree.
The install advisory scan reports zero vulnerabilities. axe/Playwright is a
pinned development dependency; no audit scripts or telemetry run in the app.

Local validation passed lint, TypeScript, 1,140 unit tests, and 32 browser
journeys in Chromium and mobile WebKit. The GitHub Pages export passed the
1 GB ceiling at 938,239,665 bytes and opened all 100 English tool routes.
The offline export check covered 200 cold English and Arabic tool routes
before and after an update. Physical iPhone cold launch, VoiceOver, and OS
storage eviction still need device checks.

## 1.4.1

Smart Convert and JSON Formatter enable editing when their handlers are ready,
so early typing survives a slow page load. The browser check for a sustained
Liquid Glass drag waits for visible tab bounds after Back navigation.
