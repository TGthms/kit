# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**日常のツールをブラウザで。プライバシーを前提に設計。**

Kit は、PDF・画像・音声/動画・変換・テキスト処理を端末上で完結させるユーティリティ集です。処理はブラウザ内で行われ、ファイルを Kit のサーバーへ送ることはありません。

**サイト:** https://trykit.pages.dev

**作者:** https://tgthms.github.io/about/

## このプロジェクトについて

まとまりのある、使いやすいツールキットです。明快な UI、ライト/ダーク、多言語対応、インストール可能な PWA シェル、そしてブラウザでできることの限界を正直に示すことを大切にしています。

## 対応言語（UI）

**English · Español · 中文 · 日本語**

## ツール一覧

ホームは仕事ごとにグループ分けしています（PDF のページ / 保護 / マーク、データ、文章、開発）。

### PDF
結合、分割、整理、ページ番号、圧縮、ロック、メタデータ、フォーム固定、透かし、覆い、署名（見た目）、取り出し、PDF↔画像。

### 画像
圧縮、切り抜き、回転、フィルター、透かし、EXIF、ファビコン。

### 音声・動画
変換、波形つき切り取り、速度、音声取り出し、クリップ → GIF。

### データ / 文章 / 開発
JSON、YAML、SQL、XML、JSON→TypeScript。Markdown、差分、ケース変換。JWT、タイムスタンプ、cron、ハッシュ、パスワード、QR。

## プライバシー

- **端末上**で処理
- 履歴は**要約のみ**（ファイル本体は保存しません）
- 設定はブラウザのローカルストレージ
- [プライバシーポリシー](https://trykit.pages.dev/ja/privacy/) · [利用規約](https://trykit.pages.dev/ja/terms/)

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
