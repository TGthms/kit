# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Και οι 30 γλώσσες του README</summary>

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
- **Ελληνικά**
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

**Καθημερινά εργαλεία στο πρόγραμμα περιήγησης. Ιδιωτικά από τον σχεδιασμό.**

Το Kit είναι ένα σύνολο εργαλείων PDF, εικόνας, πολυμέσων, μετατροπής και κειμένου που τρέχουν στη συσκευή σας. Η επεξεργασία μένει στο πρόγραμμα περιήγησης — τίποτα δεν στέλνεται σε διακομιστή του Kit.

**Ιστότοπος:** https://trykit.pages.dev

**Σχετικά με τον συγγραφέα:** https://t-g.pages.dev

## Τι παίρνετε

Ένα επιμελημένο κιτ: καθαρή διάταξη, φωτεινό και σκοτεινό, 30 γλώσσες με εγγενή επιλογέα, εγκαταστάσιμη PWA και ειλικρινή όρια για το τι μπορεί να κάνει ένα πρόγραμμα περιήγησης.

## Γλώσσες

Το περιβάλλον της εφαρμογής και αυτό το README στο GitHub είναι σε **30 γλώσσες**. Αλλάξτε στις Ρυθμίσεις (ή στην κεφαλίδα) με εγγενή επιλογέα ή χρησιμοποιήστε τους συνδέσμους επάνω. Αραβικά και εβραϊκά είναι από δεξιά προς τα αριστερά. Απόρρητο και όροι μεταφράζονται όταν υπάρχει εγγενές νομικό κείμενο· αλλιώς αγγλικά. Οι παλιοί σύνδεσμοι `/zh/` οδηγούν ακόμα στα απλοποιημένα κινεζικά.

## Εργαλεία

Η αρχική ομαδοποιεί τα εργαλεία ανά εργασία (σελίδες PDF, δεδομένα, ανάπτυξη…) αντί για μία επίπεδη λίστα.

### PDF
- Συγχώνευση, διαχωρισμός, οργάνωση, αριθμοί σελίδων
- Συμπίεση, κλείδωμα/ξεκλείδωμα, μεταδεδομένα, ισοπέδωση
- Υδατογράφημα, οπτική κάλυψη, πληκτρολογημένη υπογραφή
- Εξαγωγή κειμένου, PDF → ZIP εικόνων, εικόνες → PDF

### Εικόνες
- Συμπίεση, αλλαγή μεγέθους, περικοπή, περιστροφή/αναστροφή, πακέτο favicon
- Ρύθμιση, φίλτρα, υδατογράφημα
- Μετατροπή JPEG/PNG/WEBP, προβολή/αφαίρεση EXIF

### Ήχος και βίντεο
- Μετατροπή, περικοπή με κυματομορφή, ταχύτητα/ένταση, εξαγωγή ήχου, κλιπ → GIF  
  *(FFmpeg WASM· μεγάλα αρχεία μπορεί να αργούν· περιορισμένοι κωδικοποιητές)*

### Δεδομένα
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → διεπαφές TypeScript
- Κόμβος μετατροπής

### Γραφή
- Markdown ↔ HTML, σύγκριση κειμένου, πεζά/κεφαλαία, Lorem ipsum

### Ανάπτυξη
- Αποκωδικοποίηση JWT, χρονική σήμανση Unix, cron, αριθμητική βάση
- Κατακερματισμός (SHA/MD5), regex, χρώμα
- Base64, URL, οντότητες HTML
- UUID, γεννήτρια κωδικών, QR

## Απόρρητο

- Τα εργαλεία επεξεργάζονται δεδομένα **στη συσκευή σας**
- Το ιστορικό κρατά μόνο **περιλήψεις** (όχι το περιεχόμενο αρχείων)
- Οι προτιμήσεις μένουν στην τοπική αποθήκευση
- [Πολιτική απορρήτου](https://trykit.pages.dev/el/privacy/) · [Όροι χρήσης](https://trykit.pages.dev/el/terms/)

## Τοπική ανάπτυξη

Απαιτήσεις: **Node.js 24+** (βλ. `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Ανοίξτε http://localhost:3000 — η προεπιλεγμένη γλώσσα οδηγεί στο `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Βασική διαδρομή

Για GitHub Pages έργου, μεταγλωττίστε με:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Τοπικά χωρίς πρόθεμα (`NEXT_PUBLIC_BASE_PATH` κενό).

## Δημοσίευση στο GitHub Pages

### Αυτόματα (προτείνεται)

1. Στείλτε αυτό το αποθετήριο στο **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Η ροή [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) μεταγλωττίζει με `NEXT_PUBLIC_BASE_PATH=/kit` και δημοσιεύει το `out/`

### Χειροκίνητα

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL Pages: `https://TGthms.github.io/kit/`  
Κανονικός ιστότοπος: `https://trykit.pages.dev`

## Τεχνολογία

Next.js 16 (App Router, στατική εξαγωγή) · TypeScript · Tailwind CSS · UI σε στιλ shadcn · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Άδεια

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
