# HeroUI adoption plan

Assessment: 2026-10-24. Requested direction: gradual migration across Kit. This document plans adoption; no HeroUI dependencies or production components have been changed in this pass.

## Decision

HeroUI **v3** is a feasible candidate for Kit's shared web controls and overlays. Kit already uses React 19.2.8, Next 16.3.8, Tailwind 4 and next-themes. HeroUI's documented requirements are React 19+ and Tailwind 4, and its Next.js integration supports this architecture. Use the React web package, not HeroUI Native (React Native/Expo).

The published `@heroui/react@latest` metadata returned **3.2.6** during this assessment, with React/React DOM >=19 and Tailwind >=4 peers. Pin an exact version for the initial pilot and inspect its installed exports and notices. The package metadata lists React Aria/React Aria Components and associated packages as peers; budget those too. Package unpacked size is **not** the browser bundle size. No claim about an improvement in Kit's loading performance has been established.

## Integration constraints

- Preserve Kit's colors, system fonts, Dynamic Type, safe-area spacing, reduced-motion behavior, document scrolling, deliberate-touch math input and installed-only page zoom policy. Do not import a global theme and assume current screens are unchanged.
- Kit's `--accent` is a pale hover surface; HeroUI's accent is a principal action color. Its `--muted`, `--radius`, field and surface variables also need explicit mapping. First isolate the HeroUI token scope or namespace Kit's conflicting tokens, including portal content. Test light and dark themes before broadening the scope.
- Import component JavaScript through supported package subpaths and import only required component CSS. Keep heavy controls on the routes that use them. Use locally bundled assets so CSP, static export and offline downloads continue to work.
- Existing `src/components/ui/` wrappers are the migration boundary. Their public props, refs, labels, native form behavior, `asChild` links, DOM events and haptic data attributes have callers throughout the tools. HeroUI's press/selection/value APIs differ; adapt deliberately rather than replacing imports globally.
- The experimental Liquid Glass SDK remains opt-in and restricted to the switch, slider and mobile tab bar. Keep the stable mobile capsule as its fallback. Changing a standard primitive must not alter that fallback's shape, size or keyboard behavior without a separate review.
- MathLive editing and graph pointer gestures, numerical workers, media processing and service-worker update/download transactions remain Kit-owned. A UI library does not replace these systems or make offline storage permanent.

## Migration batches

| Batch | Work | Completion check |
| --- | --- | --- |
| 1. Foundation and pilot | Add pinned packages and a token bridge with selective CSS. Pilot a Button and an overlay in Settings, behind the existing wrapper boundary. Keep the pilot easy to revert. | Compare actual compressed JS/CSS loaded on home, Settings and one tool before/after. Validate prerendered HTML, hydration, both themes, text scaling, reduced motion, iPhone portrait/landscape and desktop. No unexplained global restyling or cold-start regression. |
| 2. Overlays and menus | Move dialogs, popovers and confirmation surfaces to accessible shared wrappers. Start with support/shortcut dialogs and secondary menus; preserve iframe payment behavior and math-keyboard dismissal. | Escape, focus trap/return, background inertness, scroll position and nested overlays work with keyboard, touch and VoiceOver. A swipe/scroll must not activate a control. |
| 3. Forms | Migrate fields, selects, switches, sliders and validation a family at a time. Preserve numeric input modes, 16px mobile input text, selection/search and form submission. Keep native mobile selects where they provide a better experience. | Existing callers and behavior tests pass. Check decimals, IME, paste, RTL, screen-reader names and invalid input. Exercise standard and experimental Liquid Glass paths. |
| 4. Search and navigation | Adapt the anchored search combobox, segmented controls and desktop menus where HeroUI adds value. Preserve a single primary search, mobile search-on-scroll, scroll restoration and instant feedback. | Home/category/tool navigation remains a client transition when its offline payload is saved. Search stays a dropdown. Modified clicks and browser Back work; no keyboard/nav overlap. Stable mobile bar stays available. |
| 5. Tool surfaces | Adopt shared cards, disclosures, lists and progress presentations across tool families in small batches. Start with Everyday/Math, then data/text, then file/media tools. | Tool-specific processing, cancel/error states, layout, accessible output and offline dependencies remain correct. Validate all supported locales for overflow. Avoid redesigning 100 tools in one commit. |
| 6. Cleanup | Remove a Radix primitive, old CSS or another dependency only when its last caller is migrated. Consolidate theme tokens and document wrapper contracts. | Dependency graph has no accidental duplicate implementation, and root plus `/kit` production exports pass. |

Each batch should be reviewable and deployed independently after validation. Pause expansion if physical iPhone behavior or measured startup costs regress. HeroUI can provide consistent interaction primitives while Kit keeps its own visual identity; adopting its default showcase styling everywhere is not required.

## Release checks

1. Meaningful wrapper/interaction tests, typecheck and lint; retain existing tests rather than weakening them to match a new implementation.
2. Production export at `/` and `/kit`, including complete prerendered tool content and local asset discovery.
3. Fresh online install, cold reopen and normal background/resume; actual iOS Home Screen and macOS Add to Dock checks remain device verification.
4. Download a changed route/tool, disconnect and navigate/reopen it. Stage an update from the prior release, apply it explicitly and reopen offline. Check active tool work is not discarded automatically.
5. Compare compressed route assets and interaction responsiveness against the same production baseline. Tree shaking is an implementation property to verify, not an assumption based on the package size.

## Primary references

- [HeroUI quick start and requirements](https://heroui.com/en/docs/react/getting-started/quick-start)
- [HeroUI theming, selective CSS and next-themes](https://heroui.com/en/docs/react/getting-started/theming)
- [HeroUI repository and component subpaths](https://github.com/heroui-inc/heroui)
- [Published React package metadata](https://registry.npmjs.org/@heroui/react/latest)

Published package metadata and repository HEAD are different artifacts and can change independently. Check the chosen release itself during Batch 1, including the license notices shipped with it.
