# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · **العربية**

<details>
<summary>لغات README الثلاثون كلها</summary>

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
- **العربية**
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

**أدوات يومية في المتصفح. خاصة منذ التصميم.**

Kit مجموعة أدوات PDF وصور ووسائط وتحويل ونص تعمل على جهازك. تبقى المعالجة في المتصفح — لا يُرسل شيء إلى خادم Kit.

**الموقع:** https://trykit.pages.dev

**عن المؤلف:** https://tgthms.github.io/about/

## ماذا تحصل عليه

طقم متقن: تخطيط واضح، مظهر فاتح وداكن، واجهة بـ 30 لغة مع منتقي أصلي، تطبيق ويب قابل للتثبيت، وحدود صادقة لما يستطيع المتصفح فعله.

## اللغات

واجهة التطبيق وهذا الملف على GitHub متاحان بـ **30 لغة**. بدّل في الإعدادات (أو الشريط العلوي) بمنتقٍ أصلي، أو عبر الروابط أعلاه. العربية والعبرية من اليمين إلى اليسار. سياسة الخصوصية والشروط مترجمان عند وجود نص قانوني أصلي؛ وإلا فالإنجليزية. روابط `/zh/` القديمة ما زالت تؤدي إلى الصينية المبسطة.

## الأدوات

الشاشة الرئيسية تجمّع الأدوات حسب المهمة (صفحات PDF، بيانات، تطوير…) بدل قائمة مسطحة.

### PDF
- دمج، تقسيم، تنظيم، أرقام صفحات
- ضغط، قفل/فتح، بيانات وصفية، تسطيح
- علامة مائية، تغطية بصرية، توقيع مكتوب
- استخراج نص، PDF → أرشيف صور، صور → PDF

### الصور
- ضغط، تحجيم، قص، تدوير/قلب، حزمة أيقونات
- ضبط، مرشحات، علامة مائية
- تحويل JPEG/PNG/WEBP، عرض/إزالة EXIF

### الصوت والفيديو
- تحويل، قص بموجة صوتية، سرعة/مستوى صوت، استخراج صوت، مقطع → GIF  
  *(FFmpeg WASM؛ الملفات الكبيرة قد تكون بطيئة؛ ترميز محدود)*

### البيانات
- JSON / YAML / TOML / SQL، CSV ↔ JSON، XML ↔ JSON
- JSON → واجهات TypeScript
- مركز التحويل

### الكتابة
- Markdown ↔ HTML، مقارنة نص، حالة الأحرف، Lorem ipsum

### التطوير
- فك JWT، ختم Unix، cron، نظام العد
- تجزئة (SHA/MD5)، تعبير نمطي، لون
- Base64، URL، كيانات HTML
- UUID، مولّد كلمات مرور، رمز QR

## الخصوصية

- تعالج الأدوات البيانات **على جهازك**
- يحفظ السجل **ملخصات فقط** (وليس محتوى الملفات)
- تبقى التفضيلات في التخزين المحلي
- [سياسة الخصوصية](https://trykit.pages.dev/ar/privacy/) · [شروط الاستخدام](https://trykit.pages.dev/ar/terms/)

## التطوير المحلي

المتطلبات: **Node.js 22.13+** (انظر `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

افتح http://localhost:3000 — اللغة الافتراضية تحوّل إلى `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### المسار الأساسي

لصفحات مشروع GitHub ابنِ بـ:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

محليًا بلا بادئة (`NEXT_PUBLIC_BASE_PATH` فارغ).

## النشر على GitHub Pages

### تلقائي (موصى به)

1. ادفع هذا المستودع إلى **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. سير العمل [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) يبني بـ `NEXT_PUBLIC_BASE_PATH=/kit` وينشر مجلد `out/`

### يدوي

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

عنوان Pages: `https://TGthms.github.io/kit/`  
الموقع الأساسي: `https://trykit.pages.dev`

## التقنية

Next.js 15 (App Router، تصدير ثابت) · TypeScript · Tailwind CSS · واجهة بأسلوب shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · عامل خدمة PWA

## الرخصة

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
