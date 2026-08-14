# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>30 README dilinin tümü</summary>

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
- **Türkçe**
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

**Tarayıcıda günlük araçlar. Tasarımdan özel.**

Kit, cihazınızda çalışan PDF, görüntü, medya, dönüştürme ve metin araçlarıdır. İşleme tarayıcıda kalır — hiçbir şey bir Kit sunucusuna gönderilmez.

**Site:** https://trykit.pages.dev

**Yazar hakkında:** https://tgthms.github.io/about/

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

Gereksinimler: **Node.js 22.13+** (`.nvmrc` dosyasına bakın).

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
3. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) `NEXT_PUBLIC_BASE_PATH=/kit` ile derler ve `out/` klasörünü yayınlar

### Elle

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages URL’si: `https://TGthms.github.io/kit/`  
Asıl site: `https://trykit.pages.dev`

## Teknoloji

Next.js 15 (App Router, statik dışa aktarma) · TypeScript · Tailwind CSS · shadcn tarzı UI · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA service worker

## Lisans

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
