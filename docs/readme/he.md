# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>כל 30 שפות ה-README</summary>

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
- [Magyar](hu.md)
- [Română](ro.md)
- [Ελληνικά](el.md)
- [Türkçe](tr.md)
- [Русский](ru.md)
- [Українська](uk.md)
- [العربية](ar.md)
- **עברית**
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

**כלים יומיומיים בדפדפן. פרטיים מהעיצוב.**

Kit הוא אוסף כלי PDF, תמונות, מדיה, המרה וטקסט שרצים במכשיר שלך. העיבוד נשאר בדפדפן — שום דבר לא נשלח לשרת Kit.

**אתר:** https://trykit.pages.dev

**על המחבר:** https://t-g.pages.dev

## מה מקבלים

ערכה מלוטשת: פריסה ברורה, בהיר וכהה, 30 שפות עם בורר מקורי, PWA להתקנה וגבולות כנים לגבי מה שדפדפן יכול.

## שפות

ממשק האפליקציה וקובץ README זה ב-GitHub זמינים ב-**30 שפות**. החלף בהגדרות (או בכותרת) בבורר מקורי, או השתמש בקישורים למעלה. ערבית ועברית מימין לשמאל. מדיניות ותנאים מתורגמים כשיש טקסט משפטי מקורי; אחרת אנגלית. קישורי `/zh/` ישנים עדיין מובילים לסינית מפושטת.

## כלים

מסך הבית מקבץ כלים לפי משימה (עמודי PDF, נתונים, פיתוח…) במקום רשימה שטוחה.

### PDF
- מיזוג, פיצול, ארגון, מספרי עמודים
- דחיסה, נעילה/שחרור, מטא-נתונים, השטחה
- סימן מים, כיסוי חזותי, חתימה מוקלדת
- חילוץ טקסט, PDF → ZIP של תמונות, תמונות → PDF

### תמונות
- דחיסה, שינוי גודל, חיתוך, סיבוב/היפוך, חבילת favicon
- כוונון, מסננים, סימן מים
- המרת JPEG/PNG/WEBP, צפייה/הסרת EXIF

### שמע ווידאו
- המרה, חיתוך עם צורת גל, מהירות/עוצמה, חילוץ שמע, קליפ → GIF  
  *(FFmpeg WASM; קבצים גדולים עלולים להיות איטיים; קודקים מוגבלים)*

### נתונים
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → ממשקי TypeScript
- מרכז המרה

### כתיבה
- Markdown ↔ HTML, השוואת טקסט, רישיות, Lorem ipsum

### פיתוח
- פענוח JWT, חותמת Unix, cron, בסיס מספרי
- גיבוב (SHA/MD5), ביטוי רגולרי, צבע
- Base64, URL, ישויות HTML
- UUID, מחולל סיסמאות, QR

## פרטיות

- הכלים מעבדים נתונים **במכשיר שלך**
- ההיסטוריה שומרת רק **תקצירים** (לא תוכן קבצים)
- ההעדפות נשארות באחסון המקומי
- [איך Kit עובד](https://trykit.pages.dev/he/how/) · [מדיניות פרטיות](https://trykit.pages.dev/he/privacy/) · [תנאי שימוש](https://trykit.pages.dev/he/terms/)

## פיתוח מקומי

דרישות: **Node.js 24+** (ראו `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

פתחו http://localhost:3000 — שפת ברירת המחדל מפנה אל `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### נתיב בסיס

עבור GitHub Pages של פרויקט, בנו עם:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

מקומית בלי קידומת (`NEXT_PUBLIC_BASE_PATH` ריק).

## פרסום ב-GitHub Pages

### אוטומטי (מומלץ)

1. דחפו את המאגר אל **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. זרימת [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) בונה עם `NEXT_PUBLIC_BASE_PATH=/kit` ומפרסמת את `out/`

### ידני

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

כתובת Pages: `https://TGthms.github.io/kit/`  
אתר קנוני: `https://trykit.pages.dev`

## טכנולוגיה

Next.js 16 (App Router, ייצוא סטטי) · TypeScript · Tailwind CSS · ממשק בסגנון shadcn · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker של PWA

## רישיון

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
