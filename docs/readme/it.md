# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Tutte le 30 lingue del README</summary>

- [English](../../README.md)
- [Español](es.md)
- [Français](fr.md)
- [Deutsch](de.md)
- **Italiano**
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

**Strumenti di tutti i giorni nel browser. Privati per progettazione.**

Kit è un insieme di strumenti PDF, immagini, media, conversioni e testo che girano sul tuo dispositivo. L’elaborazione resta nel browser: niente viene inviato a un server Kit.

**Sito:** https://trykit.pages.dev

**Sull’autore:** https://t-g.pages.dev

## Cosa ottieni

Un kit curato: interfaccia chiara, tema chiaro e scuro, UI in 30 lingue con selettore nativo, PWA installabile e limiti onesti su ciò che un browser può fare.

## Lingue

L’interfaccia dell’app e questo README GitHub sono in **30 lingue**. Cambia in Impostazioni (o nell’intestazione) con un selettore nativo, oppure usa i link in alto. Arabo ed ebraico sono da destra a sinistra. Privacy e termini sono tradotti quando esiste un testo legale nativo; altrimenti inglese. I vecchi link `/zh/` vanno ancora al cinese semplificato.

## Strumenti

La home raggruppa gli strumenti per lavoro (pagine PDF, dati, sviluppo…) invece di un elenco piatto.

### PDF
- Unisci, dividi, organizza, numeri di pagina
- Comprimi, blocca/sblocca, metadati, appiattisci
- Filigrana, copri (visivo), firma digitata
- Estrai testo, PDF → immagini ZIP, immagini → PDF

### Immagini
- Comprimi, ridimensiona, ritaglia, ruota/specchia, pacchetto favicon
- Regola, filtri, filigrana
- Converti JPEG/PNG/WEBP, vedi/rimuovi EXIF

### Audio e video
- Converti, ritaglia con forma d’onda, velocità/volume, estrai audio, clip → GIF  
  *(FFmpeg WASM; i file grandi possono essere lenti; codec limitati)*

### Dati
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → interfacce TypeScript
- Hub di conversione

### Scrittura
- Markdown ↔ HTML, confronto testo, maiuscole/minuscole, Lorem ipsum

### Sviluppo
- Decodifica JWT, timestamp Unix, cron, base numerica
- Hash (SHA/MD5), regex, colore
- Base64, URL, entità HTML
- UUID, generatore password, QR

## Privacy

- Gli strumenti elaborano i dati **sul tuo dispositivo**
- La cronologia conserva solo **riassunti** (non i contenuti dei file)
- Le preferenze restano nell’archivio locale
- [Informativa sulla privacy](https://trykit.pages.dev/it/privacy/) · [Termini di utilizzo](https://trykit.pages.dev/it/terms/)

## Sviluppo locale

Requisiti: **Node.js 22.13+** (vedi `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Apri http://localhost:3000 — la lingua predefinita reindirizza a `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Percorso base

Per le GitHub Pages di progetto, compila con:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

In locale nessun prefisso (`NEXT_PUBLIC_BASE_PATH` vuoto).

## Pubblicare su GitHub Pages

### Automatico (consigliato)

1. Invia questo repo a **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Il workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) compila con `NEXT_PUBLIC_BASE_PATH=/kit` e pubblica `out/`

### Manuale

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL Pages: `https://TGthms.github.io/kit/`  
Sito canonico: `https://trykit.pages.dev`

## Stack tecnico

Next.js 15 (App Router, export statico) · TypeScript · Tailwind CSS · UI stile shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licenza

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
