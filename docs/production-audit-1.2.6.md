# Kit 1.2.6 reliability audit

Date: 2026-10-25. Scope: source review, failure-path tests, dependency advisories,
static exports, and the exported service worker. This is release validation,
not a guarantee that every device/browser interaction is defect-free.

## Changes resulting from the audit

| Area | Finding and correction |
| --- | --- |
| Random generator | Removed the explicit zero/two-frame reset. Existing number instances now transition directly between actual results; new results start at their actual value. Result mode and precision are snapshots, so editing settings cannot reformat old results, crash their formatter, or expose a password to the history action. |
| Random arithmetic | Reject unsafe integer/scaled decimal domains and precision with no representable result. Unrounded interpolation avoids overflowing the difference of opposite large bounds. Sparse sampling without replacement uses bounded work rather than a retry-until-unique loop. |
| Settings updates | Added a localized, hydration-safe Check for updates control below the version. Checks the scoped worker registration and its network update job. Distinguishes current, available, preparing, unsupported and failed checks; times out after 30 seconds and cancels UI work on exit. Existing prepared updates remain discoverable offline. The existing single shell toast supplies Update/progress/retry/reload, with no automatic activation from checking. |
| Restricted storage | Reading sessionStorage itself can throw before getItem runs. Chunk recovery and recent navigation now catch that failure and retain their safe fallback behavior. |
| Batch cancellation | Canceling during the final item/page previously returned success and could initiate an export. Both shared sequential loops check cancellation after each awaited unit, before completion/progress. |
| Worker failures | Synchronous math-worker postMessage failures now settle and release timers, allowing graph queues to continue. Regex worker timeout/post failures settle every queued request, construction failures release blob URLs, and retry creates a fresh worker. |
| Regex UI safety | Removed the heuristic main-thread fallback for untrusted patterns. Alternation and backreferences can be expensive even when the former nested-quantifier heuristic passes. If a worker cannot start, the UI reports that limitation instead of evaluating on the UI thread. Trusted synchronous engine APIs remain available to tests/internal callers. |
| Numerical stability | Loan PMT uses log1p/expm1 to avoid cancellation at tiny positive rates and overflow for long terms. Timer field conversion stays within safe finite milliseconds instead of crashing rendering on an extreme hours input. |
| Async result ownership | Hash and QR work is invalidated on source/algorithm changes and unmount. Old completions cannot publish misleading results or success notices for the new source. QR generation/decoding have independent scopes. |
| Image resources | QR reading uses the shared canvas budget and releases bitmap/canvas resources on errors. The shared size limiter floors scaled dimensions so rounding cannot exceed its pixel cap, and handles non-finite dimensions. |
| Currency refresh | Aborts superseded requests, imposes a 15-second request/body deadline, and clears loading when switching to a cached or same-currency pair. Network date validation rejects rolled-over invalid dates. |
| Document budgets | XML input and JSON-to-XML now use the existing text/depth/JSON budgets before recursive work. XML recursion (including declaration/comment prefixes) is bounded. |
| Keyboard access | App/tool shortcuts respect native dialogs, Kit's modal help, and React Aria alerts, and ignore composition/default-prevented key events. Commands cannot run the tool behind those dialogs. |
| Dependencies | Updated Next and its matching lint configuration from 16.3.8 to 16.4.3. The production advisory scan initially flagged three Next advisories; npm install's full dependency audit reports zero after upgrading. |

## Framework compatibility

The new Turbopack version attempted to resolve FFmpeg 0.12.15's optional,
runtime-provided classWorkerURL as a bundled module. A scoped loader uses
the equivalent Reflect.construct(URL, [value, base]) for only that optional
URL construction, keeping it a native runtime operation. The default
static worker constructor, bundled worker, vendored UMD core and WASM remain
unchanged. Tests check absolute/relative URL equivalence and prove reversing
that one expression reproduces the installed SDK source byte for byte. The
loader fails if its exact integration point
changes. No node_modules patch, alternate CDN, ignored build error, or change of
bundler is used.

Installed Next guides reviewed: progressive-web-apps, static-exports,
lazy-loading, turbopack, and turbopack configuration.

Advisories checked against upstream descriptions:

- [Image optimization](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
- [Server Actions](https://github.com/advisories/GHSA-p3m5-59mp-jv5r)
- [Cache Components](https://github.com/advisories/GHSA-673q-mjm6-r5xr)

Kit exports static HTML/JS with image optimization disabled and no running Next
server, Server Actions, or Cache Components. The flagged server attack surfaces
are not deployed; the framework was still patched as dependency maintenance.

## Coverage and release checks

The review followed the main data paths through the tool registry/loading,
shared jobs, image/PDF/media runtimes, text parsers, converters, math workers,
stores, navigation/shortcuts, Settings, and PWA registration/update/cache flows.
Existing tests also enforce catalog parity, privacy-safe history metadata,
prototype-key handling, CSP consistency, offline release transactions, source
ownership, and accessibility naming. Tests exercise specific behavior; reading
a file or passing its test does not establish exhaustive correctness.

Final check results and export generations are recorded in NOTES.md. The
export gate opens all 100 tools cold in English and Arabic with the network
absent, before and after a synthetic changed-resource update, and checks HTML,
Flight, HEAD, runtime integrity, and missing-page recovery at both hosting paths.

## Remaining verification limits

Local browser use is disabled in this Work session, so no fresh visual,
VoiceOver, physical keyboard, iOS force-quit, touch/haptics, or real-device memory
benchmark is claimed. Native PWA cold launch, math keyboard gestures and offline
navigation on the affected iPhones remain device checks after deployment.
Heavy browser conversions still depend on device memory and platform APIs;
cooperative cancellation cannot preempt a synchronous third-party codec/parser.
OS eviction of browser storage is outside Kit's control; Offline access must
continue to verify and report missing files rather than promise permanent
storage. A clean advisory scan is time-specific, not a permanent security claim.
