# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · **简体中文** · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>全部 30 种 README 语言</summary>

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
- [Bahasa Indonesia](README.id.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- **简体中文**
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**日常小工具，从设计上保护隐私。**

Kit 是一套在本地运行的实用工具：PDF、图片、音视频、格式转换与文本处理。处理过程发生在你的浏览器中，文件不会上传到任何 Kit 服务器。

**网站:** https://trykit.pages.dev

**作者:** https://tgthms.github.io/about/

## 产品定位

一套完整、好用的工具站：布局清晰，支持浅色/深色，界面 30 种语言（原生选择器），可安装的 PWA，并对浏览器能力给出诚实说明。

## 界面语言

应用界面和这份 GitHub README 提供 **30 种语言**。在设置（或顶栏）用原生选择器切换，或使用本文顶部的链接。阿拉伯语和希伯来语为从右到左。隐私政策与条款仅在有对应法律文本时本地化，其余回退英语。旧的 `/zh/` 应用链接仍指向简体中文。

## 工具一览

首页按工作分组：PDF 页面 / 保护 / 标注、数据、写作、开发，而不是一张平铺清单。

### PDF
- 合并、拆分、整理、页码
- 压缩、锁定/解锁、元数据、压平表单
- 水印、视觉遮盖、打字签名
- 提取文本、PDF → 图片 ZIP、图片 → PDF

### 图片
- 压缩、缩放、裁剪、旋转/翻转、网站图标包
- 调节、滤镜、水印
- 转换 JPEG/PNG/WEBP，查看/清除 EXIF

### 音视频
- 转换、波形裁剪、变速/音量、抽取音频、片段 → GIF  
  *（FFmpeg WASM；大文件可能较慢；编解码支持有限）*

### 数据
- JSON / YAML / TOML / SQL，CSV ↔ JSON，XML ↔ JSON
- JSON → TypeScript 接口
- 智能转换中心

### 写作
- Markdown ↔ HTML、文本对比、大小写、Lorem ipsum

### 开发
- JWT 解码、Unix 时间戳、cron、进制
- 哈希 (SHA/MD5)、正则、颜色
- Base64、URL、HTML 实体
- UUID、密码生成、二维码

## 隐私

- 在**本机浏览器**中处理
- 历史只保存**摘要**，不保存文件内容
- 偏好设置保存在浏览器本地存储
- [隐私政策](https://trykit.pages.dev/zh/privacy/) · [使用条款](https://trykit.pages.dev/zh/terms/)

## 本地开发

需要 **Node.js 22.13+**（见 `.nvmrc`）。

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

打开 http://localhost:3000 — 默认语言会转到 `/en/`。

```bash
npm run build
npm run typecheck
npm run lint
```

### 项目站路径前缀

发布到 GitHub 项目 Pages 时这样构建：

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

本地默认没有前缀（`NEXT_PUBLIC_BASE_PATH` 为空）。

## 部署到 GitHub Pages

### 自动（推荐）

1. 将本仓库推送到 **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. 工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 使用 `NEXT_PUBLIC_BASE_PATH=/kit` 构建并部署 `out/`

### 手动

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages 地址：`https://TGthms.github.io/kit/`  
正式站点：`https://trykit.pages.dev`

## 技术栈

Next.js 15（App Router，静态导出）· TypeScript · Tailwind CSS · shadcn 风格 UI · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA Service Worker

## 许可证

[MIT](LICENSE) © Tim G（GitHub: [TGthms](https://github.com/TGthms)）
