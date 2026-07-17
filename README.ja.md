# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**日常のツールをブラウザで。プライバシーを前提に設計。**

Kit は、PDF・画像・音声/動画・変換・テキスト処理を端末上で完結させるユーティリティ集です。処理はブラウザ内で行われ、ファイルを Kit のサーバーへ送ることはありません。

**サイト:** https://TGthms.github.io/kit/

**作者:** https://tgthms.github.io/about/

## このプロジェクトについて

まとまりのある、使いやすいツールキットです。明快な UI、ライト/ダーク、多言語対応、インストール可能な PWA シェル、そしてブラウザでできることの限界を正直に示すことを大切にしています。

## 対応言語（UI）

**English · Español · 中文 · 日本語**

## ツール一覧

### PDF
結合、分割、ページ整理、圧縮、透かし、覆い（見た目）、テキスト/画像の取り出し。

### 画像
圧縮、リサイズ、切り抜き、形式変換、メタデータ削除、明るさ/コントラスト/彩度。

### 音声・動画
形式変換、切り取り、速度と音量、音声の取り出し  
*（FFmpeg WASM。大きなファイルは遅く、コーデック対応にも限りがあります）*。

### 変換
スマート変換ハブ（JSON、YAML、CSV、ZIP、画像など）。

### テキスト・データ
JSON / YAML / TOML、Markdown ↔ HTML、CSV ↔ JSON、テキスト比較、Base64、URL エンコード。

## プライバシー

- **端末上**で処理
- 履歴は**要約のみ**（ファイル本体は保存しません）
- 設定はブラウザのローカルストレージ
- [プライバシーポリシー](https://TGthms.github.io/kit/ja/privacy/) · [利用規約](https://TGthms.github.io/kit/ja/terms/)

## ローカル開発

**Node.js 22.13+** が必要です（`.nvmrc` 参照）。

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

### ベースパス（プロジェクト Pages）

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

## GitHub Pages への公開

### 自動（推奨）

1. リポジトリ: **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) が `NEXT_PUBLIC_BASE_PATH=/kit` でビルドし `out/` を公開します

### 手動

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

URL: `https://TGthms.github.io/kit/`

## ライセンス

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
