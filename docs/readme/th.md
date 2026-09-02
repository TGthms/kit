# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>ภาษา README ทั้ง 30 ภาษา</summary>

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
- [Русский](ru.md)
- [Українська](uk.md)
- [العربية](ar.md)
- [עברית](he.md)
- [हिन्दी](hi.md)
- **ไทย**
- [Tiếng Việt](vi.md)
- [Bahasa Indonesia](id.md)
- [日本語](ja.md)
- [한국어](ko.md)
- [简体中文](zh-Hans.md)
- [繁體中文](zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**เครื่องมือใช้ประจำในเบราว์เซอร์ เป็นส่วนตัวตั้งแต่การออกแบบ**

Kit คือชุดเครื่องมือ PDF รูปภาพ สื่อ แปลงไฟล์ และข้อความที่ทำงานบนอุปกรณ์ของคุณ การประมวลผลอยู่ในเบราว์เซอร์ — ไม่ส่งอะไรไปยังเซิร์ฟเวอร์ของ Kit

**เว็บไซต์:** https://trykit.pages.dev

**เกี่ยวกับผู้เขียน:** https://t-g.pages.dev

## สิ่งที่คุณได้

ชุดเครื่องมือที่จัดเรียบร้อย: เลย์เอาต์ชัด โหมดสว่างและมืด 30 ภาษาพร้อมตัวเลือกแบบเนทีฟ PWA ที่ติดตั้งได้ และข้อจำกัดที่พูดตรง ๆ ว่าเบราว์เซอร์ทำอะไรได้

## ภาษา

อินเทอร์เฟซแอปและ README นี้บน GitHub มี **30 ภาษา** สลับในการตั้งค่า (หรือส่วนหัว) ด้วยตัวเลือกเนทีฟ หรือใช้ลิงก์ด้านบน อาหรับและฮีบรูเป็นขวาไปซ้าย นโยบายและความเป็นส่วนตัวแปลเมื่อมีข้อความกฎหมายของภาษานั้น ไม่เช่นนั้นเป็นอังกฤษ ลิงก์ `/zh/` เก่ายังชี้ไปจีนตัวย่อ

## เครื่องมือ

หน้าแรกจัดกลุ่มเครื่องมือตามงาน (หน้า PDF, ข้อมูล, พัฒนา…) ไม่ใช่รายการแบนราบ

### PDF
- รวม แยก จัดระเบียบ เลขหน้า
- บีบอัด ล็อก/ปลดล็อก เมทาดาทา แบนฟอร์ม
- ลายน้ำ ปิดบังทางสายตา ลายเซ็นพิมพ์
- แยกข้อความ PDF → ZIP รูป รูป → PDF

### รูปภาพ
- บีบอัด ปรับขนาด ครอป หมุน/พลิก ชุด favicon
- ปรับ ตัวกรอง ลายน้ำ
- แปลง JPEG/PNG/WEBP ดู/ลบ EXIF

### เสียงและวิดีโอ
- แปลง ตัดด้วยคลื่นเสียง ความเร็ว/ระดับเสียง แยกเสียง คลิป → GIF  
  *(FFmpeg WASM ไฟล์ใหญ่อาจช้า ตัวแปลงสัญญาณจำกัด)*

### ข้อมูล
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → อินเทอร์เฟซ TypeScript
- ศูนย์แปลง

### การเขียน
- Markdown ↔ HTML เปรียบเทียบข้อความ ตัวพิมพ์ Lorem ipsum

### นักพัฒนา
- ถอด JWT ตราประทับ Unix cron ฐานตัวเลข
- แฮช (SHA/MD5) เรกเอ็กซ์ สี
- Base64 URL เอนทิตี HTML
- UUID ตัวสร้างรหัสผ่าน QR

## ความเป็นส่วนตัว

- เครื่องมือประมวลผลข้อมูล **บนอุปกรณ์ของคุณ**
- ประวัติเก็บเฉพาะ **สรุป** (ไม่เก็บเนื้อหาไฟล์)
- ค่ากำหนดอยู่ในที่เก็บในเครื่อง
- [นโยบายความเป็นส่วนตัว](https://trykit.pages.dev/th/privacy/) · [ข้อกำหนดการใช้งาน](https://trykit.pages.dev/th/terms/)

## การพัฒนาในเครื่อง

ความต้องการ: **Node.js 24+** (ดู `.nvmrc`)

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

เปิด http://localhost:3000 — ภาษาเริ่มต้นไปที่ `/en/`

```bash
npm run build
npm run typecheck
npm run lint
```

### พาธฐาน

สำหรับ GitHub Pages ของโปรเจกต์ ให้สร้างด้วย:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

ในเครื่องไม่มีคำนำหน้า (`NEXT_PUBLIC_BASE_PATH` ว่าง)

## เผยแพร่บน GitHub Pages

### อัตโนมัติ (แนะนำ)

1. พุชที่เก็บนี้ไปที่ **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. เวิร์กโฟลว์ [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) สร้างด้วย `NEXT_PUBLIC_BASE_PATH=/kit` แล้วเผยแพร่ `out/`

### ด้วยตนเอง

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL ของ Pages: `https://TGthms.github.io/kit/`  
ไซต์หลัก: `https://trykit.pages.dev`

## เทคโนโลยี

Next.js 16 (App Router ส่งออกแบบคงที่) · TypeScript · Tailwind CSS · UI สไตล์ shadcn · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA service worker

## สัญญาอนุญาต

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
