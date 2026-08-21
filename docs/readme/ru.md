# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Все 30 языков README</summary>

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
- **Русский**
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

**Повседневные инструменты в браузере. Приватные по замыслу.**

Kit — набор инструментов для PDF, изображений, медиа, конвертации и текста, которые работают на вашем устройстве. Обработка остаётся в браузере — ничего не отправляется на сервер Kit.

**Сайт:** https://trykit.pages.dev

**Об авторе:** https://t-g.pages.dev

## Что вы получаете

Аккуратный набор: ясная вёрстка, светлая и тёмная темы, 30 языков с нативным выбором, устанавливаемое PWA и честные пределы того, что умеет браузер.

## Языки

Интерфейс приложения и этот README на GitHub есть на **30 языках**. Переключайте в «Настройках» (или в шапке) нативным списком либо ссылками сверху. Арабский и иврит — справа налево. Политика и условия переведены, если есть свой юридический текст; иначе английский. Старые ссылки `/zh/` по-прежнему ведут на упрощённый китайский.

## Инструменты

Главный экран группирует инструменты по задаче (страницы PDF, данные, разработка…), а не одной плоской кучей.

### PDF
- Объединение, разделение, порядок, номера страниц
- Сжатие, блокировка/разблокировка, метаданные, сведение
- Водяной знак, визуальное закрытие, набранная подпись
- Извлечение текста, PDF → ZIP изображений, изображения → PDF

### Изображения
- Сжатие, размер, обрезка, поворот/отражение, набор favicon
- Коррекция, фильтры, водяной знак
- Конвертация JPEG/PNG/WEBP, просмотр/удаление EXIF

### Аудио и видео
- Конвертация, обрезка с осциллограммой, скорость/громкость, извлечение звука, клип → GIF  
  *(FFmpeg WASM; большие файлы могут быть медленными; ограниченные кодеки)*

### Данные
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → интерфейсы TypeScript
- Хаб конвертации

### Текст
- Markdown ↔ HTML, сравнение текста, регистр, Lorem ipsum

### Разработка
- Декодирование JWT, метка Unix, cron, система счисления
- Хеш (SHA/MD5), regex, цвет
- Base64, URL, HTML-сущности
- UUID, генератор паролей, QR

## Конфиденциальность

- Инструменты обрабатывают данные **на вашем устройстве**
- История хранит только **краткие сводки** (не содержимое файлов)
- Настройки остаются в локальном хранилище
- [Политика конфиденциальности](https://trykit.pages.dev/ru/privacy/) · [Условия использования](https://trykit.pages.dev/ru/terms/)

## Локальная разработка

Требования: **Node.js 22.13+** (см. `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Откройте http://localhost:3000 — язык по умолчанию ведёт на `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Базовый путь

Для GitHub Pages проекта собирайте так:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Локально без префикса (`NEXT_PUBLIC_BASE_PATH` пуст).

## Публикация на GitHub Pages

### Автоматически (рекомендуется)

1. Отправьте этот репозиторий в **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Сценарий [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) собирает с `NEXT_PUBLIC_BASE_PATH=/kit` и публикует `out/`

### Вручную

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Адрес Pages: `https://TGthms.github.io/kit/`  
Канонический сайт: `https://trykit.pages.dev`

## Стек

Next.js 15 (App Router, статическая выгрузка) · TypeScript · Tailwind CSS · UI в стиле shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Лицензия

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
