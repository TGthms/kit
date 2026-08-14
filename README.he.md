# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>כל 30 שפות ה-README</summary>

- [English](README.md)
- [Español](README.es.md)
- [Français](README.fr.md)
- [Deutsch](README.de.md)
- [Italiano](README.it.md)
- [Português (Brasil)](README.pt-BR.md)
- [Português (Portugal)](README.pt-PT.md)
- [Nederlands](README.nl.md)
- [Dansk](README.da.md)
- [Svenska](README.sv.md)
- [Norsk Bokmål](README.nb.md)
- [Suomi](README.fi.md)
- [Polski](README.pl.md)
- [Čeština](README.cs.md)
- [Magyar](README.hu.md)
- [Română](README.ro.md)
- [Ελληνικά](README.el.md)
- [Türkçe](README.tr.md)
- [Русский](README.ru.md)
- [Українська](README.uk.md)
- [العربية](README.ar.md)
- **עברית**
- [हिन्दी](README.hi.md)
- [ไทย](README.th.md)
- [Tiếng Việt](README.vi.md)
- [Bahasa Indonesia](README.id.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [简体中文](README.zh-Hans.md)
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**כלים יומיומיים בדפדפן. פרטיים מהעיצוב.**

Kit הוא אוסף כלי PDF, תמונות, מדיה, המרה וטקסט שרצים במכשיר שלך. העיבוד נשאר בדפדפן — שום דבר לא נשלח לשרת Kit.

**אתר:** https://trykit.pages.dev

**על המחבר:** https://tgthms.github.io/about/

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
- [מדיניות פרטיות](https://trykit.pages.dev/he/privacy/) · [תנאי שימוש](https://trykit.pages.dev/he/terms/)

## פיתוח מקומי

דרישות: **Node.js 22.13+** (ראו `.nvmrc`).

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
3. זרימת [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) בונה עם `NEXT_PUBLIC_BASE_PATH=/kit` ומפרסמת את `out/`

### ידני

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

כתובת Pages: `https://TGthms.github.io/kit/`  
אתר קנוני: `https://trykit.pages.dev`

## טכנולוגיה

Next.js 15 (App Router, ייצוא סטטי) · TypeScript · Tailwind CSS · ממשק בסגנון shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker של PWA

## רישיון

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
