# Installed-app release checks

Record the release/build, device, OS, pass/fail and reproduction notes. Desktop
WebKit emulation is useful coverage; it does not certify iOS Home Screen launch,
OS storage retention, VoiceOver, haptics or native keyboard gestures.

- iPhone 16 Pro Max: installed Kit, portrait and landscape, both appearances,
  larger text, reduced motion and VoiceOver. Include a lower-memory supported
  phone and macOS Add to Dock when available.
- Fresh install, normal resume, force-close/cold reopen online and in Airplane
  Mode. A spinner should appear promptly, without a prolonged blank screen.
- Download a small selection and an all-tool collection; wait for verified
  readiness. Disconnect, force-close and open previously unopened tools.
- Start downloads, navigate away/back, cancel, interrupt the connection and
  retry. Progress and readiness must describe the actual saved collection.
- Update from the preceding release. Interrupt while staging, verify the old
  collection still works offline, reconnect and explicitly apply the update.
  Reopen offline and use a previously unopened tool in the new collection.
- Edit a graph, navigate away/back and force-close. Recover expressions, bounds,
  parameters and colors. Save/name/restore/delete a graph; disable automatic
  recovery and confirm only automatic drafts are cleared.
- Math input: tap to edit; scroll across an input without opening the keyboard;
  type letters, switch layouts, release keys, dismiss/reopen, rotate and open
  help. No stuck key highlight or keyboard/nav overlap.
- Compress/convert an image, share or download it, then send the result to
  Images to PDF. Cancel a running conversion and change its source/options;
  the old completion must not reappear.
- Open/close help and graph settings with touch, keyboard and VoiceOver. Check
  Escape, focus containment/return, inert background and text scaling.
- Export/import preferences on a second device. Review before confirming; history
  remains unchanged. Review diagnostics before copying; no file names or inputs.
- Stable navigation and experimental Liquid Glass paths: drag, switch tabs and
  use switches/sliders. Unsupported SDK controls must retain their stable fallback.
