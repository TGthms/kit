# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>30 README dilinin tümü</summary>

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
- **Türkçe**
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

**Tarayıcıda günlük araçlar. Tasarımdan özel.**

Kit, cihazınızda çalışan PDF, görüntü, medya, dönüştürme ve metin araçlarıdır. İşleme tarayıcıda kalır — hiçbir şey bir Kit sunucusuna gönderilmez.

**Site:** https://trykit.pages.dev

**Yazar hakkında:** https://t-g.pages.dev

## Ne elde edersiniz

Özenli bir araç seti: net yerleşim, açık ve koyu görünüm, yerel seçicili 30 dil, yüklenebilir PWA ve bir tarayıcının yapabileceklerine dair dürüst sınırlar.

## Diller

Uygulama arayüzü ve bu GitHub README **30 dilde** vardır. Ayarlar’da (veya üst çubukta) yerel bir seçiciyle ya da yukarıdaki bağlantılarla değiştirin. Arapça ve İbranice sağdan sola gider. Gizlilik ve şartlar yerli hukuki metin varsa çevrilidir; yoksa İngilizce. Eski `/zh/` bağlantıları hâlâ Basitleştirilmiş Çince’ye gider.

## Araçlar

Ana ekran araçları işe göre gruplar (PDF sayfaları, veri, geliştirme…) düz bir liste yerine.

### PDF
- Birleştir, böl, düzenle, sayfa numaraları
- Sıkıştır, kilitle/aç, üst veri, düzleştir
- Filigran, görsel örtü, yazılmış imza
- Metin çıkar, PDF → görüntü ZIP, görüntüler → PDF

### Görüntüler
- Sıkıştır, yeniden boyutlandır, kırp, döndür/çevir, favicon paketi
- Ayarla, süzgeçler, filigran
- JPEG/PNG/WEBP dönüştür, EXIF görüntüle/kaldır

### Ses ve video
- Dönüştür, dalga formuyla kırp, hız/ses, ses çıkar, klip → GIF  
  *(FFmpeg WASM; büyük dosyalar yavaş olabilir; sınırlı kodlayıcılar)*

### Veri
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript arayüzleri
- Dönüştürme merkezi

### Yazım
- Markdown ↔ HTML, metin karşılaştırma, büyük/küçük harf, Lorem ipsum

### Geliştirme
- JWT çöz, Unix zaman damgası, cron, sayı tabanı
- Özet (SHA/MD5), regex, renk
- Base64, URL, HTML varlıkları
- UUID, parola üreteci, QR

## Gizlilik

- Araçlar verileri **cihazınızda** işler
- Geçmiş yalnızca **özet** tutar (dosya içeriğini değil)
- Tercihler yerel depoda kalır
- [Gizlilik Politikası](https://trykit.pages.dev/tr/privacy/) · [Kullanım Koşulları](https://trykit.pages.dev/tr/terms/)

## Yerel geliştirme

Gereksinimler: **Node.js 24+** (`.nvmrc` dosyasına bakın).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

http://localhost:3000 adresini açın — varsayılan dil `/en/` konumuna yönlendirir.

```bash
npm run build
npm run typecheck
npm run lint
```

### Taban yolu

Proje GitHub Pages için şununla derleyin:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Yerelde önek yok (`NEXT_PUBLIC_BASE_PATH` boş).

## GitHub Pages’e yayınla

### Otomatik (önerilir)

1. Bu depoyu **https://github.com/TGthms/kit** adresine itin
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) `NEXT_PUBLIC_BASE_PATH=/kit` ile derler ve `out/` klasörünü yayınlar

### Elle

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages URL’si: `https://TGthms.github.io/kit/`  
Asıl site: `https://trykit.pages.dev`

## Teknoloji

Next.js 16 (App Router, statik dışa aktarma) · TypeScript · Tailwind CSS · shadcn tarzı UI · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA service worker

## Lisans

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
