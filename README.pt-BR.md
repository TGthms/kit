# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Português (Brasil)** · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Os 30 idiomas do README</summary>

- [English](README.md)
- [Español](README.es.md)
- [Français](README.fr.md)
- [Deutsch](README.de.md)
- [Italiano](README.it.md)
- **Português (Brasil)**
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
- [简体中文](README.zh-Hans.md)
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Ferramentas do dia a dia no navegador. Privadas por desenho.**

Kit é um conjunto de ferramentas de PDF, imagem, mídia, conversão e texto que rodam no seu dispositivo. O processamento fica no navegador — nada é enviado a um servidor Kit.

**Site:** https://trykit.pages.dev

**Sobre o autor:** https://tgthms.github.io/about/

## O que você ganha

Um kit caprichado: layout claro, claro e escuro, interface em 30 idiomas com seletor nativo, PWA instalável e limites honestos do que um navegador consegue fazer.

## Idiomas

A interface do app e este README do GitHub estão em **30 idiomas**. Troque em Ajustes (ou no cabeçalho) com um seletor nativo, ou use os links acima. Árabe e hebraico são da direita para a esquerda. Privacidade e termos são traduzidos quando há texto jurídico nativo; senão, inglês. Links antigos `/zh/` ainda levam ao chinês simplificado.

## Ferramentas

A capa agrupa as ferramentas por trabalho (páginas PDF, dados, desenvolvimento…) em vez de uma lista plana.

### PDF
- Mesclar, dividir, organizar, números de página
- Comprimir, bloquear/desbloquear, metadados, achatar
- Marca d’água, cobrir (visual), assinatura digitada
- Extrair texto, PDF → imagens ZIP, imagens → PDF

### Imagens
- Comprimir, redimensionar, recortar, girar/espelhar, pacote favicon
- Ajustar, filtros, marca d’água
- Converter JPEG/PNG/WEBP, ver/remover EXIF

### Áudio e vídeo
- Converter, recortar com forma de onda, velocidade/volume, extrair áudio, clipe → GIF  
  *(FFmpeg WASM; arquivos grandes podem ser lentos; codecs limitados)*

### Dados
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → interfaces TypeScript
- Hub de conversão

### Escrita
- Markdown ↔ HTML, comparação de texto, maiúsculas/minúsculas, Lorem ipsum

### Desenvolvimento
- Decodificar JWT, carimbo Unix, cron, base numérica
- Hash (SHA/MD5), regex, cor
- Base64, URL, entidades HTML
- UUID, gerador de senhas, QR

## Privacidade

- As ferramentas processam dados **no seu dispositivo**
- O histórico guarda só **resumos** (não o conteúdo dos arquivos)
- As preferências ficam no armazenamento local
- [Política de privacidade](https://trykit.pages.dev/pt-BR/privacy/) · [Termos de uso](https://trykit.pages.dev/pt-BR/terms/)

## Desenvolvimento local

Requisitos: **Node.js 22.13+** (veja `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Abra http://localhost:3000 — o idioma padrão redireciona para `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Caminho base

Para GitHub Pages de projeto, compile com:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

No local não há prefixo (`NEXT_PUBLIC_BASE_PATH` vazio).

## Publicar no GitHub Pages

### Automático (recomendado)

1. Envie este repositório para **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. O fluxo [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila com `NEXT_PUBLIC_BASE_PATH=/kit` e publica `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL do Pages: `https://TGthms.github.io/kit/`  
Site canônico: `https://trykit.pages.dev`

## Stack

Next.js 15 (App Router, exportação estática) · TypeScript · Tailwind CSS · UI estilo shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licença

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
