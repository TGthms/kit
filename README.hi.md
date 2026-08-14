# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>README की सभी 30 भाषाएँ</summary>

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
- **हिन्दी**
- [ไทย](README.th.md)
- [Tiếng Việt](README.vi.md)
- [Bahasa Indonesia](README.id.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [简体中文](README.zh-Hans.md)
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ब्राउज़र में रोज़मर्रा के उपकरण। डिज़ाइन से निजी।**

Kit PDF, छवि, मीडिया, रूपांतरण और पाठ उपकरणों का सेट है जो आपके उपकरण पर चलते हैं। प्रसंस्करण ब्राउज़र में रहता है — कुछ भी Kit सर्वर पर नहीं भेजा जाता।

**साइट:** https://trykit.pages.dev

**लेखक के बारे में:** https://tgthms.github.io/about/

## आपको क्या मिलता है

एक संवारा हुआ टूलकिट: साफ़ लेआउट, हल्का और गहरा रूप, मूल चयनक के साथ 30 भाषाएँ, इंस्टॉल करने योग्य PWA, और ब्राउज़र की सीमाओं की ईमानदार जानकारी।

## भाषाएँ

ऐप इंटरफ़ेस और यह GitHub README **30 भाषाओं** में हैं। सेटिंग्स (या हेडर) में मूल चयनक से बदलें, या ऊपर के लिंक इस्तेमाल करें। अरबी और हिब्रू दाएँ-से-बाएँ हैं। गोपनीयता और शर्तें वहीं अनूदित हैं जहाँ मूल कानूनी पाठ है; वरना अंग्रेज़ी। पुराने `/zh/` लिंक अभी भी सरलीकृत चीनी पर जाते हैं।

## उपकरण

होम स्क्रीन उपकरणों को काम के हिसाब से समूहबद्ध करती है (PDF पृष्ठ, डेटा, विकास…) एक सपाट सूची की जगह।

### PDF
- मर्ज, विभाजन, व्यवस्थित करना, पृष्ठ संख्या
- संपीड़न, ताला/खोलना, मेटाडेटा, समतल करना
- वॉटरमार्क, दृश्य आवरण, टाइप किया हस्ताक्षर
- पाठ निकालना, PDF → चित्र ZIP, चित्र → PDF

### छवियाँ
- संपीड़न, आकार, क्रॉप, घुमाना/पलटना, फ़ेविकॉन पैक
- समायोजन, फ़िल्टर, वॉटरमार्क
- JPEG/PNG/WEBP रूपांतरण, EXIF देखना/हटाना

### ऑडियो और वीडियो
- रूपांतरण, तरंग के साथ काटना, गति/आवाज़, ऑडियो निकालना, क्लिप → GIF  
  *(FFmpeg WASM; बड़ी फ़ाइलें धीमी हो सकती हैं; सीमित कोडेक)*

### डेटा
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript इंटरफ़ेस
- रूपांतरण हब

### लेखन
- Markdown ↔ HTML, पाठ तुलना, केस, Lorem ipsum

### विकास
- JWT डिकोड, Unix टाइमस्टैंप, cron, संख्या आधार
- हैश (SHA/MD5), रेगेक्स, रंग
- Base64, URL, HTML इकाइयाँ
- UUID, पासवर्ड जनरेटर, QR

## गोपनीयता

- उपकरण डेटा **आपके उपकरण पर** संसाधित करते हैं
- इतिहास केवल **सारांश** रखता है (फ़ाइल सामग्री नहीं)
- वरीयताएँ स्थानीय संग्रहण में रहती हैं
- [गोपनीयता नीति](https://trykit.pages.dev/hi/privacy/) · [उपयोग की शर्तें](https://trykit.pages.dev/hi/terms/)

## स्थानीय विकास

आवश्यकता: **Node.js 22.13+** (देखें `.nvmrc`)।

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

http://localhost:3000 खोलें — डिफ़ॉल्ट भाषा `/en/` पर जाती है।

```bash
npm run build
npm run typecheck
npm run lint
```

### आधार पथ

प्रोजेक्ट GitHub Pages के लिए इससे बिल्ड करें:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

स्थानीय रूप से कोई उपसर्ग नहीं (`NEXT_PUBLIC_BASE_PATH` खाली)।

## GitHub Pages पर प्रकाशित करें

### स्वचालित (अनुशंसित)

1. इस रेपो को **https://github.com/TGthms/kit** पर पुश करें
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. वर्कफ़्लो [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) `NEXT_PUBLIC_BASE_PATH=/kit` से बिल्ड करता है और `out/` प्रकाशित करता है

### मैन्युअल

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages URL: `https://TGthms.github.io/kit/`  
मुख्य साइट: `https://trykit.pages.dev`

## तकनीक

Next.js 15 (App Router, स्थैतिक निर्यात) · TypeScript · Tailwind CSS · shadcn-शैली UI · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA सेवा वर्कर

## लाइसेंस

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
