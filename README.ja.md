# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · **日本語** · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>README の全 30 言語</summary>

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
- **日本語**
- [한국어](README.ko.md)
- [简体中文](README.zh-Hans.md)
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**日常のツールをブラウザで。プライバシーを前提に設計。**

Kit は、PDF・画像・音声/動画・変換・テキスト処理を端末上で完結させるユーティリティ集です。処理はブラウザ内で行われ、ファイルを Kit のサーバーへ送ることはありません。

**サイト:** https://trykit.pages.dev

**作者について:** https://tgthms.github.io/about/

## できること

まとまりのあるツールキットです。明快な UI、ライト/ダーク、ネイティブな言語ピッカーによる 30 言語、インストール可能な PWA、そしてブラウザでできることの限界を正直に示します。

## 対応言語

アプリの UI とこの GitHub README は **30 言語** です。設定（またはヘッダー）のネイティブなピッカー、またはこのファイル先頭のリンクで切り替えます。アラビア語とヘブライ語は右から左です。プライバシーと利用規約は、その言語の法務文がある場合のみ翻訳し、それ以外は英語です。古い `/zh/` リンクは簡体字中国語に解決されます。

## ツール

ホームは仕事ごとにグループ分けしています（PDF のページ / 保護 / マーク、データ、文章、開発）。

### PDF
- 結合、分割、整理、ページ番号
- 圧縮、ロック/解除、メタデータ、フォーム固定
- 透かし、見た目の覆い、入力サイン
- テキスト抽出、PDF → 画像 ZIP、画像 → PDF

### 画像
- 圧縮、リサイズ、切り抜き、回転/反転、ファビコン一式
- 調整、フィルター、透かし
- JPEG/PNG/WEBP 変換、EXIF の表示/削除

### 音声と動画
- 変換、波形つき切り取り、速度/音量、音声抽出、クリップ → GIF  
  *(FFmpeg WASM。大きなファイルは遅く、対応コーデックは限られます)*

### データ
- JSON / YAML / TOML / SQL、CSV ↔ JSON、XML ↔ JSON
- JSON → TypeScript インターフェース
- 変換ハブ

### 文章
- Markdown ↔ HTML、テキスト差分、大文字小文字、Lorem ipsum

### 開発
- JWT デコード、Unix タイムスタンプ、cron、基数変換
- ハッシュ (SHA/MD5)、正規表現、色
- Base64、URL、HTML 実体参照
- UUID、パスワード生成、QR

## プライバシー

- データは **端末上** で処理します
- 履歴は **要約のみ**（ファイル本体は保存しません）
- 設定はブラウザのローカルストレージに残ります
- [プライバシーポリシー](https://trykit.pages.dev/ja/privacy/) · [利用規約](https://trykit.pages.dev/ja/terms/)

## ローカル開発

**Node.js 22.13+** が必要です（`.nvmrc` 参照）。

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

http://localhost:3000 を開くと、既定ロケールは `/en/` へリダイレクトします。

```bash
npm run build
npm run typecheck
npm run lint
```

### ベースパス

GitHub のプロジェクト Pages では次でビルドします。

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

ローカル既定ではプレフィックスなし（`NEXT_PUBLIC_BASE_PATH` は空）。

## GitHub Pages への公開

### 自動（推奨）

1. このリポジトリを **https://github.com/TGthms/kit** に push
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) が `NEXT_PUBLIC_BASE_PATH=/kit` でビルドし `out/` を公開します

### 手動

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages URL: `https://TGthms.github.io/kit/`  
正規の公開先: `https://trykit.pages.dev`

## 技術スタック

Next.js 15（App Router、静的エクスポート）· TypeScript · Tailwind CSS · shadcn 風 UI · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA サービスワーカー

## ライセンス

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
