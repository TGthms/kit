# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Ke-30 bahasa README</summary>

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
- [עברית](README.he.md)
- [हिन्दी](README.hi.md)
- [ไทย](README.th.md)
- [Tiếng Việt](README.vi.md)
- **Bahasa Indonesia**
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [简体中文](README.zh-Hans.md)
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Alat sehari-hari di peramban. Privat sejak dirancang.**

Kit adalah kumpulan alat PDF, gambar, media, konversi, dan teks yang berjalan di perangkat Anda. Pemrosesan tetap di peramban — tidak ada yang dikirim ke server Kit.

**Situs:** https://trykit.pages.dev

**Tentang penulis:** https://tgthms.github.io/about/

## Apa yang Anda dapatkan

Perangkat yang rapi: tata letak jelas, terang dan gelap, 30 bahasa dengan pemilih asli, PWA yang dapat dipasang, dan batas jujur tentang kemampuan peramban.

## Bahasa

Antarmuka aplikasi dan README GitHub ini tersedia dalam **30 bahasa**. Ganti di Pengaturan (atau header) dengan pemilih asli, atau pakai tautan di atas. Arab dan Ibrani dari kanan ke kiri. Privasi dan ketentuan diterjemahkan jika ada teks hukum asli; jika tidak, bahasa Inggris. Tautan `/zh/` lama masih menuju Tionghoa Sederhana.

## Alat

Layar beranda mengelompokkan alat menurut pekerjaan (halaman PDF, data, pengembangan…) alih-alih satu daftar datar.

### PDF
- Gabung, pisah, atur, nomor halaman
- Kompres, kunci/buka, metadata, ratakan
- Tanda air, penutup visual, tanda tangan ketikan
- Ekstrak teks, PDF → ZIP gambar, gambar → PDF

### Gambar
- Kompres, ubah ukuran, potong, putar/balik, paket favicon
- Sesuaikan, filter, tanda air
- Konversi JPEG/PNG/WEBP, lihat/hapus EXIF

### Audio dan video
- Konversi, potong dengan bentuk gelombang, kecepatan/volume, ekstrak audio, klip → GIF  
  *(FFmpeg WASM; berkas besar bisa lambat; codec terbatas)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → antarmuka TypeScript
- Pusat konversi

### Menulis
- Markdown ↔ HTML, banding teks, huruf besar/kecil, Lorem ipsum

### Pengembangan
- Dekode JWT, stempel waktu Unix, cron, basis bilangan
- Hash (SHA/MD5), regex, warna
- Base64, URL, entitas HTML
- UUID, pembuat kata sandi, QR

## Privasi

- Alat memproses data **di perangkat Anda**
- Riwayat hanya menyimpan **ringkasan** (bukan isi berkas)
- Preferensi tetap di penyimpanan lokal
- [Kebijakan Privasi](https://trykit.pages.dev/id/privacy/) · [Ketentuan Penggunaan](https://trykit.pages.dev/id/terms/)

## Pengembangan lokal

Persyaratan: **Node.js 22.13+** (lihat `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Buka http://localhost:3000 — bahasa bawaan mengalihkan ke `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Jalur dasar

Untuk GitHub Pages proyek, bangun dengan:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Lokal tanpa awalan (`NEXT_PUBLIC_BASE_PATH` kosong).

## Terbitkan ke GitHub Pages

### Otomatis (disarankan)

1. Dorong repositori ini ke **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Alur [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) membangun dengan `NEXT_PUBLIC_BASE_PATH=/kit` dan menerbitkan `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL Pages: `https://TGthms.github.io/kit/`  
Situs kanonis: `https://trykit.pages.dev`

## Teknologi

Next.js 15 (App Router, ekspor statis) · TypeScript · Tailwind CSS · UI bergaya shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Lisensi

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
