# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**日常小工具，从设计上保护隐私。**

Kit 是一套在本地运行的实用工具：PDF、图片、音视频、格式转换与文本处理。处理过程发生在你的浏览器中，文件不会上传到任何 Kit 服务器。

**网站：** https://TGthms.github.io/kit/

**作者：** https://tgthms.github.io/about/

## 产品定位

一套完整、好用的工具站：布局清晰，支持浅色/深色，界面多语言，可安装的 PWA 外壳（访问过后可更好离线使用），并对浏览器能力给出诚实说明。

## 界面语言

**English · Español · 中文 · 日本語**

## 工具一览

### PDF
合并、拆分、整理页面、压缩、水印、遮盖（视觉遮盖）、提取文本或图片。

### 图片
压缩、调整尺寸、裁剪、格式转换、清除元数据、亮度/对比度/饱和度。

### 音视频
格式转换、裁剪、速度与音量、提取音频  
*（FFmpeg WASM；大文件可能较慢，编解码支持有限）*。

### 转换
智能转换中心（JSON、YAML、CSV、ZIP、图片等）。

### 文本与数据
JSON / YAML / TOML、Markdown ↔ HTML、CSV ↔ JSON、文本对比、Base64、URL 编解码。

## 隐私

- 在**本机浏览器**中处理
- 历史只保存**摘要**，不保存文件内容
- 偏好设置保存在浏览器本地存储
- [隐私政策](https://TGthms.github.io/kit/zh/privacy/) · [使用条款](https://TGthms.github.io/kit/zh/terms/)

## 本地开发

需要 **Node.js 22.13+**（见 `.nvmrc`）。

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

### 项目站路径前缀

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

## 部署到 GitHub Pages

### 自动（推荐）

1. 仓库地址：**https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. 工作流 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 使用 `NEXT_PUBLIC_BASE_PATH=/kit` 构建并部署 `out/`

### 手动

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

访问地址：`https://TGthms.github.io/kit/`

## 许可证

[MIT](LICENSE) © Tim G（GitHub: [TGthms](https://github.com/TGthms)）
