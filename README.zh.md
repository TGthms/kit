# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**日常小工具，从设计上保护隐私。**

Kit 是一套在本地运行的实用工具：PDF、图片、音视频、格式转换与文本处理。处理过程发生在你的浏览器中，文件不会上传到任何 Kit 服务器。

**网站：** https://trykit.pages.dev

**作者：** https://tgthms.github.io/about/

## 产品定位

一套完整、好用的工具站：布局清晰，支持浅色/深色，界面多语言，可安装的 PWA 外壳（访问过后可更好离线使用），并对浏览器能力给出诚实说明。

## 界面语言

**English · Español · 中文 · 日本語**

## 工具一览

首页按工作分组：PDF 页面 / 保护 / 标注、数据、写作、开发。

### PDF
合并、拆分、整理、页码、压缩、锁定、元数据、压平、水印、遮盖、打字签名、提取、PDF↔图片。

### 图片
压缩、裁剪、旋转、滤镜、水印、EXIF、网站图标。

### 音视频
转换、波形裁剪、变速、抽音频、片段 → GIF。

### 数据 / 写作 / 开发
JSON、YAML、SQL、XML、JSON→TypeScript；Markdown、对比、大小写；JWT、时间戳、cron、哈希、密码、二维码。

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
