# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · [한국어](ko.md) · [العربية](ar.md)

<details>
<summary>Os 30 idiomas do README</summary>

- [English](../../README.md)
- [Español](es.md)
- [Français](fr.md)
- [Deutsch](de.md)
- [Italiano](it.md)
- [Português (Brasil)](pt-BR.md)
- **Português (Portugal)**
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
- [繁體中文](zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**Ferramentas do dia a dia no navegador. Privadas por conceção.**

Kit é um conjunto de ferramentas de PDF, imagem, média, conversão e texto que correm no seu dispositivo. O processamento fica no navegador — nada é enviado a um servidor Kit.

**Sítio:** https://trykit.pages.dev

**Sobre o autor:** https://t-g.pages.dev

## O que obtém

Um kit cuidado: disposição clara, claro e escuro, interface em 30 idiomas com seletor nativo, PWA instalável e limites honestos do que um navegador consegue fazer.

## Idiomas

A interface da aplicação e este README do GitHub estão em **30 idiomas**. Mude em Definições (ou no cabeçalho) com um seletor nativo, ou use as ligações acima. Árabe e hebraico são da direita para a esquerda. Privacidade e termos estão traduzidos quando existe texto jurídico nativo; caso contrário, inglês. As ligações antigas `/zh/` continuam a ir para chinês simplificado.

## Ferramentas

A página inicial agrupa as ferramentas por trabalho (páginas PDF, dados, desenvolvimento…) em vez de uma lista plana.

### PDF
- Juntar, dividir, organizar, números de página
- Comprimir, bloquear/desbloquear, metadados, achatar
- Marca de água, cobrir (visual), assinatura dactilografada
- Extrair texto, PDF → imagens ZIP, imagens → PDF

### Imagens
- Comprimir, redimensionar, recortar, rodar/espelhar, pacote favicon
- Ajustar, filtros, marca de água
- Converter JPEG/PNG/WEBP, ver/remover EXIF

### Áudio e vídeo
- Converter, recortar com forma de onda, velocidade/volume, extrair áudio, clipe → GIF  
  *(FFmpeg WASM; ficheiros grandes podem ser lentos; codecs limitados)*

### Dados
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → interfaces TypeScript
- Centro de conversão

### Escrita
- Markdown ↔ HTML, comparação de texto, maiúsculas/minúsculas, Lorem ipsum

### Desenvolvimento
- Descodificar JWT, carimbo Unix, cron, base numérica
- Hash (SHA/MD5), regex, cor
- Base64, URL, entidades HTML
- UUID, gerador de palavras-passe, QR

## Privacidade

- As ferramentas processam dados **no seu dispositivo**
- O histórico guarda apenas **resumos** (não o conteúdo dos ficheiros)
- As preferências ficam no armazenamento local
- [Política de privacidade](https://trykit.pages.dev/pt-PT/privacy/) · [Termos de utilização](https://trykit.pages.dev/pt-PT/terms/)

## Desenvolvimento local

Requisitos: **Node.js 24+** (ver `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Abra http://localhost:3000 — o idioma predefinido redireciona para `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Caminho de base

Para GitHub Pages de projeto, compile com:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Em local não há prefixo (`NEXT_PUBLIC_BASE_PATH` vazio).

## Publicar no GitHub Pages

### Automático (recomendado)

1. Envie este repositório para **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. O fluxo [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) compila com `NEXT_PUBLIC_BASE_PATH=/kit` e publica `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL do Pages: `https://TGthms.github.io/kit/`  
Sítio canónico: `https://trykit.pages.dev`

## Stack

Next.js 16 (App Router, exportação estática) · TypeScript · Tailwind CSS · UI estilo shadcn · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licença

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))

Kit’s own source is MIT. Audio and video tools also load an FFmpeg WebAssembly engine (`@ffmpeg/core`) licensed **GPL-2.0-or-later** (H.264 / LAME and related codecs). That engine is served from this site and runs in your browser; media is not uploaded to a Kit server. pdf.js and other libraries keep their own Apache, BSD, or MIT licenses.
