# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**ブラウザで使える日常ツール。プライバシーを前提に。**

Kit は、PDF・画像・音声/動画・変換・テキスト/データ向けの、高品質なクライアント完結ユーティリティです。処理はブラウザ内で行われ、ファイルは Kit のサーバーへアップロードされません。

**公開サイト（GitHub Pages）:** https://TGthms.github.io/kit/

**作者について:** https://tgthms.github.io/about/

## ビジョン

まとまりのある洗練されたツールキット。明快な UI、ライト/ダーク、多言語、オフライン可能な PWA シェル、ブラウザ処理の限界を正直に示すこと。

## 言語

UI と法的ページ: **English · Español · 中文 · 日本語**

## ツール

### PDF
結合、分割、整理、圧縮、透かし、墨消し（視覚的な覆い）、テキスト/画像抽出。

### 画像
圧縮、リサイズ、クロップ、形式変換、メタデータ削除、調整。

### 音声・動画
形式変換、トリム、速度・音量、音声抽出（FFmpeg WASM・単一スレッド。大きいファイルは遅い場合あり）。

### 変換
スマート変換ハブ（JSON/YAML/CSV/ZIP/画像）。

### テキスト・データ
JSON/YAML/TOML、Markdown ↔ HTML、CSV ↔ JSON、差分、Base64、URL エンコード。

## プライバシー

- **端末上**で処理
- 履歴は**メタデータのみ**
- 設定はローカルストレージ
- [プライバシーポリシー](https://TGthms.github.io/kit/ja/privacy/) · [利用規約](https://TGthms.github.io/kit/ja/terms/)

## ローカル開発

**Node.js 20+** が必要です（`.nvmrc` 参照）。

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

### ベースパス

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

## GitHub Pages へのデプロイ

### 自動（推奨）

1. リポジトリを **https://github.com/TGthms/kit** に push
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) が `NEXT_PUBLIC_BASE_PATH=/kit` でビルドし `out/` を公開

### 手動

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

URL: `https://TGthms.github.io/kit/`

## ライセンス

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
