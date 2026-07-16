# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**浏览器中的日常工具。隐私优先。**

Kit 是一套高质量的客户端实用工具：PDF、图片、音视频、格式转换与文本/数据。处理在浏览器中完成，文件不会上传到 Kit 服务器。

**在线地址（GitHub Pages）：** https://TGthms.github.io/kit/

**关于作者：** https://tgthms.github.io/about/

## 愿景

统一、精致、受 iOS 启发的工具站：清晰布局、深浅色、多语言、可安装的 PWA 外壳，并对浏览器能力给出诚实说明。

## 语言

界面与法律页面：**English · Español · 中文 · 日本語**

## 工具一览

### PDF
合并、拆分、整理、压缩、水印、遮盖（视觉遮盖）、提取文本/图片。

### 图片
压缩、缩放、裁剪、格式转换、清除元数据、亮度/对比度/饱和度。

### 音视频
格式转换、裁剪、速度与音量、提取音频（FFmpeg WASM，单线程；大文件可能较慢）。

### 转换
智能转换中心（JSON/YAML/CSV/ZIP/图片）。

### 文本与数据
JSON/YAML/TOML、Markdown ↔ HTML、CSV ↔ JSON、文本对比、Base64、URL 编解码。

## 隐私

- 在**本机浏览器**中处理
- 历史仅保存**元数据**
- 偏好保存在本地存储
- [隐私政策](https://TGthms.github.io/kit/zh/privacy/) · [使用条款](https://TGthms.github.io/kit/zh/terms/)

## 本地开发

需要 **Node.js 20+**（见 `.nvmrc`）。

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

```bash
npm run build
npm run typecheck
npm run lint
```

### Base path

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

## 部署到 GitHub Pages

### 自动（推荐）

1. 将仓库推送到 **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. 工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 使用 `NEXT_PUBLIC_BASE_PATH=/kit` 构建并部署 `out/`

### 手动

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

站点：`https://TGthms.github.io/kit/`

## 许可证

[MIT](LICENSE) © Tim G（GitHub: [TGthms](https://github.com/TGthms)）
