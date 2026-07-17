# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Utilidades del día a día en el navegador. Pensadas para tu privacidad.**

Kit es un conjunto de herramientas que se ejecutan en tu dispositivo: PDF, imágenes, audio y vídeo, conversiones y texto. El procesamiento ocurre en el cliente; no enviamos tus archivos a un servidor de Kit.

**Sitio:** https://TGthms.github.io/kit/

**Autor:** https://tgthms.github.io/about/

## Para qué sirve

Un kit de utilidades coherente y cuidado: interfaz clara, modo claro y oscuro, varios idiomas, shell PWA con uso sin conexión cuando ya has visitado la app, y límites honestos sobre lo que un navegador puede hacer.

## Idiomas de la interfaz

**English · Español · 中文 · 日本語**

## Herramientas

### PDF
Unir, dividir, organizar páginas, comprimir, marca de agua, cubrir zonas (visualmente), extraer texto o imágenes.

### Imágenes
Comprimir, redimensionar, recortar, convertir formato, quitar metadatos, ajustar brillo/contraste/saturación.

### Audio y vídeo
Convertir, recortar, velocidad y volumen, extraer audio  
*(FFmpeg WASM; los archivos grandes pueden ser lentos y no todos los códecs están disponibles)*.

### Convertidores
Centro de conversión inteligente (JSON, YAML, CSV, ZIP, imágenes…).

### Texto y datos
JSON / YAML / TOML, Markdown ↔ HTML, CSV ↔ JSON, comparación de textos, Base64, codificación de URL.

## Privacidad

- El trabajo se hace **en tu dispositivo**
- El historial guarda solo **resúmenes**, no el contenido de los archivos
- Las preferencias viven en el almacenamiento local del navegador
- [Política de privacidad](https://TGthms.github.io/kit/es/privacy/) · [Condiciones de uso](https://TGthms.github.io/kit/es/terms/)

## Desarrollo local

Necesitas **Node.js 22.13+** (ver `.nvmrc`).

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

### Ruta base (GitHub Pages de proyecto)

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

## Publicar en GitHub Pages

### Automático (recomendado)

1. El repositorio está en **https://github.com/TGthms/kit**
2. En GitHub: **Settings → Pages → Source: GitHub Actions**
3. El flujo [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila con `NEXT_PUBLIC_BASE_PATH=/kit` y publica la carpeta `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

URL: `https://TGthms.github.io/kit/`

## Licencia

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
