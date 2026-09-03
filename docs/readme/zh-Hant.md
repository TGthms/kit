# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · **繁體中文** · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>全部 30 種 README 語言</summary>

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
- [Tiếng Việt](vi.md)
- [Bahasa Indonesia](id.md)
- [日本語](ja.md)
- [한국어](ko.md)
- [简体中文](zh-Hans.md)
- **繁體中文**

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**日常小工具，從設計上保護隱私。**

Kit 是一套在本機執行的實用工具：PDF、圖片、影音、格式轉換與文字處理。處理過程發生在你的瀏覽器中，檔案不會上傳到任何 Kit 伺服器。

**網站:** https://trykit.pages.dev

**作者:** https://t-g.pages.dev

## 產品定位

一套完整、好用的工具站：版面清楚，支援淺色／深色，介面 30 種語言（原生選擇器），可安裝的 PWA，並誠實說明瀏覽器能力的界線。

## 介面語言

應用介面與這份 GitHub README 提供 **30 種語言**。在設定（或頂列）用原生選擇器切換，或使用本文頂部的連結。阿拉伯文與希伯來文為由右至左。隱私權政策與條款僅在有對應法律文本時在地化，其餘回退英文。舊的 `/zh/` 應用連結仍指向簡體中文。

## 工具一覽

首頁依工作分組：PDF 頁面／保護／標註、資料、寫作、開發，而不是一張平鋪清單。

### PDF
- 合併、拆分、整理、頁碼
- 壓縮、鎖定／解鎖、中繼資料、壓平表單
- 浮水印、視覺遮蓋、打字簽名
- 擷取文字、PDF → 圖片 ZIP、圖片 → PDF

### 圖片
- 壓縮、縮放、裁切、旋轉／翻轉、網站圖示包
- 調整、濾鏡、浮水印
- 轉換 JPEG/PNG/WEBP，檢視／清除 EXIF

### 影音
- 轉換、波形裁切、變速／音量、抽取音訊、片段 → GIF  
  *（FFmpeg WASM；大檔可能較慢；編解碼支援有限）*

### 資料
- JSON / YAML / TOML / SQL，CSV ↔ JSON，XML ↔ JSON
- JSON → TypeScript 介面
- 智慧轉換中心

### 寫作
- Markdown ↔ HTML、文字比對、大小寫、Lorem ipsum

### 開發
- JWT 解碼、Unix 時間戳、cron、進位
- 雜湊 (SHA/MD5)、正規表示式、顏色
- Base64、URL、HTML 實體
- UUID、密碼產生、QR

## 隱私

- 在**本機瀏覽器**中處理
- 歷程只保存**摘要**，不保存檔案內容
- 偏好設定保存在瀏覽器本機儲存
- [隱私權政策](https://trykit.pages.dev/zh-Hant/privacy/) · [使用條款](https://trykit.pages.dev/zh-Hant/terms/)

## 本機開發

需要 **Node.js 24+**（見 `.nvmrc`）。

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

開啟 http://localhost:3000 — 預設語言會轉到 `/en/`。

```bash
npm run build
npm run typecheck
npm run lint
```

### 專案站路徑前綴

發佈到 GitHub 專案 Pages 時這樣建置：

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

本機預設沒有前綴（`NEXT_PUBLIC_BASE_PATH` 為空）。

## 部署到 GitHub Pages

### 自動（建議）

1. 將本倉庫推送到 **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. 工作流程 [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) 使用 `NEXT_PUBLIC_BASE_PATH=/kit` 建置並部署 `out/`

### 手動

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages 位址：`https://TGthms.github.io/kit/`  
正式站點：`https://trykit.pages.dev`

## 技術棧

Next.js 16（App Router，靜態匯出）· TypeScript · Tailwind CSS · shadcn 風格 UI · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA Service Worker

## 授權

[MIT](../../LICENSE) © Tim G（GitHub: [TGthms](https://github.com/TGthms)）

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
