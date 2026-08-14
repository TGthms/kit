# Changelog

## Unreleased

### Organization
- Split the catalog into **PDF, Images, Audio, Video, Data, Writing, Developer**.
- Category screens group tools by job (pages / protect / markup, inspect / encode / generate).
- Home has a “Start here” row for high-intent tools.
- Old `?c=convert` links land in Data.

### Tools
- PDF typed signature stamp (visual, not a certificate).
- Image watermark (batch).
- Password generator, case converter, HTML entities.
- JWT decoder (no signature verify), Unix timestamp, cron explainer, number base.
- JSON → TypeScript interfaces.

### Project
- GitHub Actions runs typecheck, lint, and Vitest before the Pages build.
- Lockfile regenerated for npm 10 so `npm ci` matches GitHub’s Node 22.
