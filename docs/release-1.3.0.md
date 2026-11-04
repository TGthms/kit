# Kit 1.3.0 — cohesive tools and release safeguards

Approved scope: all eight recommendations from the 2026-11-02 review. Recent
observance greeting preferences and copy are preserved.

## User-facing changes

- Math-only automatic draft recovery covers the grapher, scientific calculator,
  fraction calculator and equation solver. Drafts flush on edits, page hide and
  navigation/unmount; corrupt/denied storage cannot break editing. A Settings
  control disables recovery and clears automatic drafts. Files, pasted text,
  passwords and generated secrets are not added to automatic persistence.
- The grapher supports up to 20 named local saved graphs, restoring expressions,
  viewport, parameters, colors, visibility, angle and grid. Explicit deletion is
  confirmed. Start fresh does not delete named saved graphs.
- Home/category/global search share accent-insensitive, deterministic ranking,
  conservative typo matching and several common task aliases. Exact tool names
  outrank incidental description matches. Existing translated keywords remain
  the multilingual source; the additional English task aliases do not imply
  natural-language understanding in every locale. Non-Latin combining marks
  are preserved. No search requests leave the device.
- Shared file results show download, device-supported file sharing, size and
  optional before/after comparison. Image conversion and compression now retain
  their result for explicit download/share or continuation. Existing other tools
  may still initiate their download when finishing, with the shared result card
  offering subsequent actions where they already use DownloadResult.
- Image compression, conversion and images-to-PDF accept direct local result
  handoffs. Transfers are single-use, targeted, expire after five minutes and
  cap at 100 files/80 MiB. They are held in memory, not cache/storage/URLs/history.
  Source/options changes cancel processing and invalidate displayed results.
  Offline handoffs check the controlling release before navigation and retain the
  current result when the destination is not downloaded.
- Shortcut help, math guidance and settings reviews use a shared HeroUI modal;
  graph settings use HeroUI Popover. Shared Field supports connected descriptions
  and errors. Native mobile selects, math editing and stable mobile navigation
  are preserved; Liquid Glass remains experimental. Broader HeroUI migration
  continues family by family, as approved in its staged plan.
- Settings groups appearance/language/greetings/haptics. Personal setup exports
  or imports a validated, versioned preferences file after human-readable review.
  Only favorites, locale, theme, haptics, observance, glass and math recovery are
  transferred. History, files, graph contents and permissions are excluded.
  Writes are checked before publishing live stores and rollback is attempted on
  failure; browser storage cannot offer a cross-key ACID transaction when the OS
  revokes storage access mid-write.
- Diagnostics are collected only on request and reviewed before copying. They
  contain app/release state, aggregate offline counts, storage estimates and a
  bounded list of allowlisted technical event codes. They exclude file names,
  inputs, arbitrary exception messages/stacks and browsing addresses. There is
  no automatic upload or new telemetry. Privacy disclosures are localized.

## Release safeguards

Production browser journeys run in Chromium and mobile WebKit against static
exports. They exercise search/navigation/Back/help focus, real MathLive graph
recovery and named graphs, image conversion/download/handoff, settings export
and diagnostic review, RTL/larger-text reflow, an eight-curve responsiveness guard,
and a real worker update with a changed saved document interrupted offline.
Browser reports/traces/screenshots are retained on CI failure. Main pushes run
the canonical CI export/browser gate and the `/kit` deployment gate.

The existing exported-worker gate still verifies all 100 tools cold in English
and Arabic before/after a changed-resource update with the network disabled.
Both `/` and `/kit` exports must pass. The physical-device checklist is in
`docs/device-release-checklist.md`; desktop emulation cannot certify Home Screen
cold launch, storage retention, haptics, VoiceOver or native keyboard behavior.
Local browser access was disabled in this session and was not bypassed.

`performance-budgets.json` limits unique HTML-referenced gzip JS/CSS for five
representative routes. This excludes HTML, dynamic imports, worker runtimes,
prefetches and background offline fills; it is not a startup-time claim. The
browser graph guard detects coarse main-thread stalls and retains frame waits;
it is not a real-device FPS or peak-memory benchmark.

| Route | 1.2.6 baseline gzip bytes | Initial 1.3.0 snapshot |
| --- | ---: | ---: |
| Home | 300,498 | 302,668 |
| Settings | 335,442 | 357,515 |
| Offline access | 287,937 | 290,373 |
| Grapher | 288,188 | 289,321 |
| Image conversion | 288,188 | 289,321 |

The Settings increase pays for review/import/export controls and their adapters.
The shared increase stays small; help and image continuation code load on demand.
Measurements are from local canonical builds and can vary with build metadata.

## Dependency review

Pinned Playwright 1.64.1 is a development-only test dependency. The production
advisory scan reports zero vulnerabilities. A new development-tool-only
[minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) is reported
through ESLint (16 moderate transitive reports). It concerns attacker-controlled
glob amplification at optimizationLevel >= 2. Kit does not ship this lint runtime
or accept user glob patterns there. No incompatible major minimatch override or
npm's suggested downgrade to old ESLint/Next lint packages was applied. Follow
up when compatible upstream fixes/backports are available.

Update preparation now shares native update requests across callers and reuses
only the exact installed Kit registration. Failed installers cancel and settle
all staging lanes. Partial entries are validated before reuse; cache-backed
copies are reconstructed from verified bytes. If staged files disappear before
readback, one bounded network repair pass uses stable handles and sequential writes to verify the exact release bytes,
then repeats full storage verification and restores/verifies the manifest. A
persistent failure cannot activate the replacement or claim it is ready. The
Settings preparation status follows installer success/failure and permits retry.

Validation results and deployment status are recorded in NOTES.md.
