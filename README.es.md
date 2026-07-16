# Kit

**[English](README.md) | [Español](README.es.md) | [中文](README.zh.md) | [日本語](README.ja.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Herramientas cotidianas en el navegador. Privacidad por diseño.**

Kit es un conjunto de utilidades de alta calidad que se ejecutan en el cliente: PDF, imágenes, audio/vídeo, convertidores y texto/datos. El procesamiento ocurre en tu navegador; los archivos no se suben a un servidor de Kit.

**Sitio (GitHub Pages):** https://TGthms.github.io/kit/

**Sobre el autor:** https://tgthms.github.io/about/

## Visión

Un kit cohesivo, con diseño inspirado en iOS: interfaz clara, modo claro/oscuro, varios idiomas, shell PWA con capacidad sin conexión y límites honestos del procesamiento en el navegador.

## Idiomas

Interfaz y páginas legales: **English · Español · 中文 · 日本語**

## Herramientas

### PDF
Unir, dividir, organizar, comprimir, marca de agua, redactar (cubierta visual), extraer texto/imágenes.

### Imagen
Comprimir, redimensionar, recortar, convertir formato, quitar metadatos, ajustar.

### Audio y vídeo
Convertir, recortar, velocidad/volumen, extraer audio *(FFmpeg WASM; archivos grandes pueden ser lentos)*.

### Convertidores
Centro de conversión inteligente (JSON/YAML/CSV/ZIP/imágenes).

### Texto y datos
JSON/YAML/TOML, Markdown ↔ HTML, CSV ↔ JSON, diff, Base64, codificación URL.

## Privacidad

- Procesamiento **en tu dispositivo**
- El historial guarda solo **metadatos**
- Preferencias en almacenamiento local
- [Política de privacidad](https://TGthms.github.io/kit/es/privacy/) · [Términos de uso](https://TGthms.github.io/kit/es/terms/)

## Desarrollo local

Requisito: **Node.js 20+** (ver `.nvmrc`).

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

## Desplegar en GitHub Pages

### Automático (recomendado)

1. Publica el repositorio en **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. El flujo [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila con `NEXT_PUBLIC_BASE_PATH=/kit` y publica `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

URL: `https://TGthms.github.io/kit/`

## Licencia

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
