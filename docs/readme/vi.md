# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Cả 30 ngôn ngữ README</summary>

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
- [ไทย](th.md)
- **Tiếng Việt**
- [Bahasa Indonesia](id.md)
- [日本語](ja.md)
- [한국어](ko.md)
- [简体中文](zh-Hans.md)
- [繁體中文](zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**Công cụ hàng ngày trong trình duyệt. Riêng tư ngay từ thiết kế.**

Kit là bộ công cụ PDF, ảnh, media, chuyển đổi và văn bản chạy trên thiết bị của bạn. Xử lý ở lại trình duyệt — không gì được gửi tới máy chủ Kit.

**Trang web:** https://trykit.pages.dev

**Về tác giả:** https://t-g.pages.dev

## Bạn nhận được gì

Một bộ công cụ chỉn chu: bố cục rõ, sáng và tối, 30 ngôn ngữ với bộ chọn gốc, PWA cài được, và giới hạn trung thực về khả năng trình duyệt.

## Ngôn ngữ

Giao diện ứng dụng và README GitHub này có **30 ngôn ngữ**. Đổi trong Cài đặt (hoặc đầu trang) bằng bộ chọn gốc, hoặc dùng liên kết phía trên. Ả Rập và Do Thái từ phải sang trái. Chính sách và điều khoản được dịch khi có văn bản pháp lý riêng; không thì tiếng Anh. Liên kết `/zh/` cũ vẫn tới tiếng Trung giản thể.

## Công cụ

Màn hình chính nhóm công cụ theo việc (trang PDF, dữ liệu, phát triển…) thay vì một danh sách phẳng.

### PDF
- Gộp, tách, sắp xếp, số trang
- Nén, khóa/mở, siêu dữ liệu, làm phẳng
- Hình mờ, che bằng mắt, chữ ký gõ
- Trích văn bản, PDF → ZIP ảnh, ảnh → PDF

### Ảnh
- Nén, đổi kích thước, cắt, xoay/lật, gói favicon
- Chỉnh, bộ lọc, hình mờ
- Chuyển JPEG/PNG/WEBP, xem/xóa EXIF

### Âm thanh và video
- Chuyển đổi, cắt với dạng sóng, tốc độ/âm lượng, tách âm thanh, clip → GIF  
  *(FFmpeg WASM; tệp lớn có thể chậm; codec hạn chế)*

### Dữ liệu
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → giao diện TypeScript
- Trung tâm chuyển đổi

### Viết
- Markdown ↔ HTML, so sánh văn bản, chữ hoa/thường, Lorem ipsum

### Phát triển
- Giải JWT, dấu thời gian Unix, cron, cơ số
- Hash (SHA/MD5), regex, màu
- Base64, URL, thực thể HTML
- UUID, tạo mật khẩu, QR

## Quyền riêng tư

- Công cụ xử lý dữ liệu **trên thiết bị của bạn**
- Lịch sử chỉ giữ **tóm tắt** (không phải nội dung tệp)
- Tùy chọn ở lại bộ nhớ cục bộ
- [Chính sách quyền riêng tư](https://trykit.pages.dev/vi/privacy/) · [Điều khoản sử dụng](https://trykit.pages.dev/vi/terms/)

## Phát triển cục bộ

Yêu cầu: **Node.js 24+** (xem `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Mở http://localhost:3000 — ngôn ngữ mặc định chuyển tới `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Đường dẫn gốc

Với GitHub Pages của dự án, dựng với:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Cục bộ không có tiền tố (`NEXT_PUBLIC_BASE_PATH` trống).

## Xuất bản lên GitHub Pages

### Tự động (khuyến nghị)

1. Đẩy kho này tới **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Quy trình [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) dựng với `NEXT_PUBLIC_BASE_PATH=/kit` và xuất bản `out/`

### Thủ công

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL Pages: `https://TGthms.github.io/kit/`  
Trang chính: `https://trykit.pages.dev`

## Công nghệ

Next.js 16 (App Router, xuất tĩnh) · TypeScript · Tailwind CSS · UI kiểu shadcn · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Giấy phép

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
