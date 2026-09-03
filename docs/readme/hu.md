# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Mind a 30 README-nyelv</summary>

- [English](../../README.md)
- [Español](es.md)
- [Français](fr.md)
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
- **Magyar**
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

**Mindennapi eszközök a böngészőben. Eleve privát.**

A Kit PDF-, kép-, média-, konvertáló és szöveges eszközök készlete, amelyek az eszközén futnak. A feldolgozás a böngészőben marad — semmi sem megy Kit-kiszolgálóra.

**Webhely:** https://trykit.pages.dev

**A szerzőről:** https://t-g.pages.dev

## Mit kap

Átgondolt eszköztár: tiszta elrendezés, világos és sötét, 30 nyelv natív választóval, telepíthető PWA, és őszinte határok arról, mire képes egy böngésző.

## Nyelvek

Az alkalmazás felülete és ez a GitHub README **30 nyelven** elérhető. Váltson a Beállításokban (vagy a fejlécben) natív választóval, vagy használja a fenti hivatkozásokat. Az arab és a héber jobbról balra megy. Az adatvédelem és a feltételek akkor vannak lefordítva, ha van saját jogi szöveg; különben angol. A régi `/zh/` hivatkozások továbbra is az egyszerűsített kínaihoz visznek.

## Eszközök

A kezdőlap feladatonként csoportosítja az eszközöket (PDF-oldalak, adatok, fejlesztés…) egy lapos lista helyett.

### PDF
- Összefűzés, darabolás, rendezés, oldalszámok
- Tömörítés, zárolás/feloldás, metaadatok, lapítás
- Vízjel, vizuális takarás, gépelt aláírás
- Szöveg kinyerése, PDF → kép-ZIP, képek → PDF

### Képek
- Tömörítés, átméretezés, vágás, forgatás/tükrözés, favicon-csomag
- Állítás, szűrők, vízjel
- JPEG/PNG/WEBP konvertálás, EXIF megtekintése/eltávolítása

### Hang és videó
- Konvertálás, vágás hullámformával, sebesség/hangerő, hang kinyerése, klip → GIF  
  *(FFmpeg WASM; a nagy fájlok lassúak lehetnek; korlátozott kodekek)*

### Adatok
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript-interfészek
- Konvertáló központ

### Írás
- Markdown ↔ HTML, szövegösszehasonlítás, kis- és nagybetű, Lorem ipsum

### Fejlesztés
- JWT dekódolás, Unix időbélyeg, cron, számrendszer
- Hash (SHA/MD5), regex, szín
- Base64, URL, HTML-entitások
- UUID, jelszógenerátor, QR

## Adatvédelem

- Az eszközök az adatokat **az Ön készülékén** dolgozzák fel
- Az előzmények csak **összefoglalókat** tárolnak (nem a fájltartalmat)
- A beállítások a helyi tárolóban maradnak
- [Adatvédelmi irányelvek](https://trykit.pages.dev/hu/privacy/) · [Felhasználási feltételek](https://trykit.pages.dev/hu/terms/)

## Helyi fejlesztés

Követelmény: **Node.js 24+** (lásd `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Nyissa meg: http://localhost:3000 — az alapértelmezett nyelv a `/en/` címre irányít.

```bash
npm run build
npm run typecheck
npm run lint
```

### Alapútvonal

GitHub projekt-Pages esetén ezzel fordítson:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Helyben nincs előtag (`NEXT_PUBLIC_BASE_PATH` üres).

## Közzététel GitHub Pagesen

### Automatikus (ajánlott)

1. Tolja ezt a repót ide: **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. A [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) `NEXT_PUBLIC_BASE_PATH=/kit` mellett fordít, és közzéteszi az `out/` mappát

### Kézi

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages URL: `https://TGthms.github.io/kit/`  
Kanonikus webhely: `https://trykit.pages.dev`

## Technológia

Next.js 16 (App Router, statikus export) · TypeScript · Tailwind CSS · shadcn-stílusú UI · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA service worker

## Licenc

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
