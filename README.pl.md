# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Wszystkie 30 języków README</summary>

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
- **Polski**
- [Čeština](README.cs.md)
- [Magyar](README.hu.md)
- [Română](README.ro.md)
- [Ελληνικά](README.el.md)
- [Türkçe](README.tr.md)
- [Русский](README.ru.md)
- [Українська](README.uk.md)
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

**Codzienne narzędzia w przeglądarce. Prywatne z założenia.**

Kit to zestaw narzędzi PDF, obrazów, mediów, konwersji i tekstu, które działają na Twoim urządzeniu. Przetwarzanie zostaje w przeglądarce — nic nie trafia na serwer Kit.

**Witryna:** https://trykit.pages.dev

**O autorze:** https://tgthms.github.io/about/

## Co dostajesz

Dopracowany zestaw: czytelny układ, jasny i ciemny motyw, 30 języków z natywnym selektorem, instalowalne PWA i szczere granice tego, co potrafi przeglądarka.

## Języki

Interfejs aplikacji i ten README na GitHubie są w **30 językach**. Zmień w Ustawieniach (lub nagłówku) natywnym selektorem albo użyj linków u góry. Arabski i hebrajski są od prawej do lewej. Polityka i regulamin są przetłumaczone, gdy jest własny tekst prawny; w przeciwnym razie angielski. Stare linki `/zh/` nadal prowadzą do chińskiego uproszczonego.

## Narzędzia

Ekran główny grupuje narzędzia według zadania (strony PDF, dane, rozwój…) zamiast płaskiej listy.

### PDF
- Łączenie, dzielenie, porządkowanie, numery stron
- Kompresja, blokada/odblokowanie, metadane, spłaszczanie
- Znak wodny, wizualne zakrycie, wpisany podpis
- Wyodrębnianie tekstu, PDF → ZIP obrazów, obrazy → PDF

### Obrazy
- Kompresja, skalowanie, kadrowanie, obrót/odbicie, pakiet favicon
- Korekta, filtry, znak wodny
- Konwersja JPEG/PNG/WEBP, podgląd/usuwanie EXIF

### Audio i wideo
- Konwersja, przycinanie z przebiegiem, prędkość/głośność, wyodrębnianie dźwięku, klip → GIF  
  *(FFmpeg WASM; duże pliki mogą być wolne; ograniczone kodeki)*

### Dane
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → interfejsy TypeScript
- Centrum konwersji

### Pisanie
- Markdown ↔ HTML, porównanie tekstu, wielkość liter, Lorem ipsum

### Rozwój
- Dekodowanie JWT, znacznik czasu Unix, cron, system liczbowy
- Hash (SHA/MD5), regex, kolor
- Base64, URL, encje HTML
- UUID, generator haseł, QR

## Prywatność

- Narzędzia przetwarzają dane **na Twoim urządzeniu**
- Historia przechowuje tylko **skróty** (nie treść plików)
- Preferencje zostają w pamięci lokalnej
- [Polityka prywatności](https://trykit.pages.dev/pl/privacy/) · [Warunki użytkowania](https://trykit.pages.dev/pl/terms/)

## Rozwój lokalny

Wymagania: **Node.js 22.13+** (zob. `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Otwórz http://localhost:3000 — domyślny język przekierowuje do `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Ścieżka bazowa

Dla GitHub Pages projektu buduj z:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokalnie bez prefiksu (`NEXT_PUBLIC_BASE_PATH` puste).

## Wdrożenie na GitHub Pages

### Automatycznie (zalecane)

1. Wypchnij to repozytorium do **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Przepływ [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) buduje z `NEXT_PUBLIC_BASE_PATH=/kit` i publikuje `out/`

### Ręcznie

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Adres Pages: `https://TGthms.github.io/kit/`  
Kanoniczna witryna: `https://trykit.pages.dev`

## Stos techniczny

Next.js 15 (App Router, eksport statyczny) · TypeScript · Tailwind CSS · UI w stylu shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licencja

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
