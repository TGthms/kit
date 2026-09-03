# Kit

[English](../../README.md) · [Español](es.md) · **Français** · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Les 30 langues du README</summary>

- [English](../../README.md)
- [Español](es.md)
- **Français**
- [Deutsch](de.md)
- [Italiano](it.md)
- [Português (Brasil)](pt-BR.md)
- [Português (Portugal)](pt-PT.md)
- [Nederlands](nl.md)
- [Dansk](da.md)
- [Svenska](sv.md)
- [Norsk Bokmål](nb.md)
- [Suomi](fi.md)
- [Polski](pl.md)
- [Čeština](cs.md)
- [Magyar](hu.md)
- [Română](ro.md)
- [Ελληνικά](el.md)
- [Türkçe](tr.md)
- [Русский](ru.md)
- [Українська](uk.md)
- [العربية](ar.md)
- [עברית](he.md)
- [हिन्दी](hi.md)
- [ไทย](th.md)
- [Tiếng Việt](vi.md)
- [Bahasa Indonesia](id.md)
- [日本語](ja.md)
- [한국어](ko.md)
- [简体中文](zh-Hans.md)
- [繁體中文](zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**Des outils du quotidien dans le navigateur. Privés par conception.**

Kit réunit des outils PDF, image, média, conversion et texte qui s’exécutent sur votre appareil. Le traitement reste dans le navigateur : rien n’est envoyé à un serveur Kit.

**Site:** https://trykit.pages.dev

**À propos de l’auteur:** https://t-g.pages.dev

## Ce que vous obtenez

Une boîte à outils soignée : mise en page claire, thèmes clair et sombre, interface en 30 langues avec un sélecteur natif, PWA installable, et des limites honnêtes sur ce qu’un navigateur peut faire.

## Langues

L’interface de l’application et ce README GitHub existent en **30 langues**. Changez-les dans Réglages (ou l’en-tête) avec un sélecteur natif, ou via les liens en haut de ce fichier. L’arabe et l’hébreu s’affichent de droite à gauche. Confidentialité et conditions sont traduites lorsqu’un texte juridique natif existe ; sinon, repli sur l’anglais. Les anciens liens `/zh/` mènent toujours au chinois simplifié.

## Outils

L’accueil groupe les outils par tâche (pages PDF, données, développement…) plutôt qu’une liste plate.

### PDF
- Fusionner, scinder, organiser, numéros de page
- Compresser, verrouiller/déverrouiller, métadonnées, aplatir
- Filigrane, occultation visuelle, signature tapée
- Extraire le texte, PDF → images ZIP, images → PDF

### Images
- Compresser, redimensionner, recadrer, pivoter/retourner, pack favicon
- Réglages, filtres, filigrane
- Convertir JPEG/PNG/WEBP, voir/retirer l’EXIF

### Audio et vidéo
- Convertir, rogner avec forme d’onde, vitesse/volume, extraire l’audio, clip → GIF  
  *(FFmpeg WASM ; les gros fichiers peuvent être lents ; codecs limités)*

### Données
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → interfaces TypeScript
- Hub de conversion

### Écriture
- Markdown ↔ HTML, comparaison de texte, casse, Lorem ipsum

### Développement
- Décodage JWT, horodatage Unix, cron, base numérique
- Hash (SHA/MD5), regex, couleur
- Base64, URL, entités HTML
- UUID, générateur de mots de passe, QR

## Confidentialité

- Les outils traitent les données **sur votre appareil**
- L’historique ne conserve que des **résumés** (pas le contenu des fichiers)
- Les préférences restent dans le stockage local
- [Politique de confidentialité](https://trykit.pages.dev/fr/privacy/) · [Conditions d’utilisation](https://trykit.pages.dev/fr/terms/)

## Développement local

Prérequis : **Node.js 24+** (voir `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Ouvrez http://localhost:3000 — la locale par défaut redirige vers `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Chemin de base

Pour les GitHub Pages de projet, compilez avec :

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

En local, aucun préfixe (`NEXT_PUBLIC_BASE_PATH` vide).

## Déployer sur GitHub Pages

### Automatique (recommandé)

1. Poussez ce dépôt vers **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Le workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) compile avec `NEXT_PUBLIC_BASE_PATH=/kit` et publie `out/`

### Manuel

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL Pages : `https://TGthms.github.io/kit/`  
Site canonique : `https://trykit.pages.dev`

## Pile technique

Next.js 16 (App Router, export statique) · TypeScript · Tailwind CSS · UI style shadcn · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licence

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
