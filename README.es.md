# Kit

[English](README.md) · **Español** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Los 30 idiomas del README</summary>

- [English](README.md)
- **Español**
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
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [简体中文](README.zh-Hans.md)
- [繁體中文](README.zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Utilidades del día a día en el navegador. Pensadas para tu privacidad.**

Kit es un conjunto de herramientas que se ejecutan en tu dispositivo: PDF, imágenes, audio y vídeo, conversiones y texto. El procesamiento ocurre en el cliente; no enviamos tus archivos a un servidor de Kit.

**Sitio:** https://trykit.pages.dev

**Autor:** https://tgthms.github.io/about/

## Para qué sirve

Un kit coherente y cuidado: interfaz clara, modo claro y oscuro, interfaz en 30 idiomas con un selector nativo, PWA instalable y límites honestos sobre lo que un navegador puede hacer.

## Idiomas

La interfaz de la app y este README de GitHub están en **30 idiomas**. Cámbialos en Ajustes (o en la cabecera) con un selector nativo, o usa los enlaces de arriba. Árabe y hebreo van de derecha a izquierda. Privacidad y términos están traducidos cuando hay texto legal nativo; el resto usa inglés. Los enlaces antiguos `/zh/` siguen yendo al chino simplificado.

## Herramientas

La portada agrupa las herramientas por trabajo (páginas PDF, datos, desarrollo…) en lugar de una lista plana.

### PDF
- Unir, dividir, organizar, numerar
- Comprimir, bloquear/desbloquear, metadatos, aplanar
- Marca de agua, cubrir (visual), firma mecanografiada
- Extraer texto, PDF → imágenes ZIP, imágenes → PDF

### Imágenes
- Comprimir, redimensionar, recortar, girar/voltear, paquete favicon
- Ajustar, filtros, marca de agua
- Convertir JPEG/PNG/WEBP, ver/quitar EXIF

### Audio y vídeo
- Convertir, recortar con forma de onda, velocidad/volumen, extraer audio, clip → GIF  
  *(FFmpeg WASM; los archivos grandes pueden ser lentos; códecs limitados)*

### Datos
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → interfaces TypeScript
- Concentrador de conversión

### Escritura
- Markdown ↔ HTML, comparación de texto, mayúsculas/minúsculas, Lorem ipsum

### Desarrollo
- Decodificar JWT, marca de tiempo Unix, cron, base numérica
- Hash (SHA/MD5), regex, color
- Base64, URL, entidades HTML
- UUID, generador de contraseñas, QR

## Privacidad

- El trabajo se hace **en tu dispositivo**
- El historial guarda solo **resúmenes**, no el contenido de los archivos
- Las preferencias viven en el almacenamiento local del navegador
- [Política de privacidad](https://trykit.pages.dev/es/privacy/) · [Condiciones de uso](https://trykit.pages.dev/es/terms/)

## Desarrollo local

Necesitas **Node.js 22.13+** (ver `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Abre http://localhost:3000 — el idioma por defecto redirige a `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Ruta base

Para GitHub Pages de proyecto, compila con:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

En local no hay prefijo (`NEXT_PUBLIC_BASE_PATH` vacío).

## Publicar en GitHub Pages

### Automático (recomendado)

1. El repositorio está en **https://github.com/TGthms/kit**
2. En GitHub: **Settings → Pages → Source: GitHub Actions**
3. El flujo [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila con `NEXT_PUBLIC_BASE_PATH=/kit` y publica `out/`

### Manual

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

URL de Pages: `https://TGthms.github.io/kit/`  
Sitio canónico: `https://trykit.pages.dev`

## Tecnología

Next.js 15 (App Router, exportación estática) · TypeScript · Tailwind CSS · UI estilo shadcn · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · service worker PWA

## Licencia

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
