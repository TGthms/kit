# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Усі 30 мов README</summary>

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
- **Українська**
- [العربية](README.ar.md)
- [עברית](README.he.md)
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

**Повсякденні інструменти в браузері. Приватні за задумом.**

Kit — набір інструментів для PDF, зображень, медіа, конвертації й тексту, які працюють на вашому пристрої. Обробка лишається в браузері — нічого не надсилається на сервер Kit.

**Сайт:** https://trykit.pages.dev

**Про автора:** https://tgthms.github.io/about/

## Що ви отримуєте

Охайний набір: зрозуміле компонування, світла й темна теми, 30 мов із нативним вибором, установлюване PWA та чесні межі того, що вміє браузер.

## Мови

Інтерфейс застосунку й цей README на GitHub є **30 мовами**. Перемикайте в «Налаштуваннях» (або в шапці) нативним списком чи посиланнями зверху. Арабська й іврит — справа наліво. Політика й умови перекладені, якщо є власний юридичний текст; інакше англійська. Старі посилання `/zh/` і далі ведуть на спрощену китайську.

## Інструменти

Головний екран групує інструменти за завданням (сторінки PDF, дані, розробка…), а не однією плоскою купою.

### PDF
- Об’єднання, поділ, порядок, номери сторінок
- Стискання, блокування/розблокування, метадані, зведення
- Водяний знак, візуальне прикриття, набраний підпис
- Витягання тексту, PDF → ZIP зображень, зображення → PDF

### Зображення
- Стискання, розмір, обрізка, поворот/віддзеркалення, набір favicon
- Корекція, фільтри, водяний знак
- Конвертація JPEG/PNG/WEBP, перегляд/вилучення EXIF

### Аудіо та відео
- Конвертація, обрізка з осцилограмою, швидкість/гучність, витягання звуку, кліп → GIF  
  *(FFmpeg WASM; великі файли можуть бути повільними; обмежені кодеки)*

### Дані
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → інтерфейси TypeScript
- Хаб конвертації

### Текст
- Markdown ↔ HTML, порівняння тексту, регістр, Lorem ipsum

### Розробка
- Декодування JWT, мітка Unix, cron, система числення
- Хеш (SHA/MD5), regex, колір
- Base64, URL, HTML-сутності
- UUID, генератор паролів, QR

## Конфіденційність

- Інструменти обробляють дані **на вашому пристрої**
- Історія зберігає лише **короткі підсумки** (не вміст файлів)
- Налаштування лишаються в локальному сховищі
- [Політика конфіденційності](https://trykit.pages.dev/uk/privacy/) · [Умови використання](https://trykit.pages.dev/uk/terms/)

## Локальна розробка

Вимоги: **Node.js 22.13+** (див. `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Відкрийте http://localhost:3000 — типова мова веде на `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Базовий шлях

Для GitHub Pages проєкту збирайте так:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Локально без префікса (`NEXT_PUBLIC_BASE_PATH` порожній).

## Публікація на GitHub Pages

### Автоматично (рекомендовано)

1. Надішліть цей репозиторій до **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Сценарій [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) збирає з `NEXT_PUBLIC_BASE_PATH=/kit` і публікує `out/`

### Вручну

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Адреса Pages: `https://TGthms.github.io/kit/`  
Канонічний сайт: `https://trykit.pages.dev`

## Стек

Next.js 15 (App Router, статичне вивантаження) · TypeScript · Tailwind CSS · UI в стилі shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Ліцензія

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
