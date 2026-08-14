# Kit

[English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [繁體中文](README.zh-Hant.md) · [한국어](README.ko.md) · [العربية](README.ar.md)

<details>
<summary>Kaikki 30 README-kieltä</summary>

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
- **Suomi**
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

**Arjen työkalut selaimessa. Yksityisiä suunnittelusta asti.**

Kit on joukko PDF-, kuva-, media-, muunto- ja tekstityökaluja, jotka toimivat laitteellasi. Käsittely pysyy selaimessa — mitään ei lähetetä Kit-palvelimelle.

**Sivusto:** https://trykit.pages.dev

**Tietoa tekijästä:** https://tgthms.github.io/about/

## Mitä saat

Huolellinen työkalupakki: selkeä asettelu, vaalea ja tumma, 30 kieltä natiivilla valitsimella, asennettava PWA ja rehelliset rajat sille, mitä selain voi tehdä.

## Kielet

Sovelluksen käyttöliittymä ja tämä GitHub-README ovat saatavilla **30 kielellä**. Vaihda Asetuksissa (tai yläpalkissa) natiivilla valitsimella tai käytä tämän tiedoston yläreunan linkkejä. Arabia ja heprea ovat oikealta vasemmalle. Tietosuoja ja ehdot on käännetty, jos oma juridinen teksti on olemassa; muuten englanti. Vanhat `/zh/`-linkit vievät edelleen yksinkertaistettuun kiinaan.

## Työkalut

Etusivu ryhmittelee työkalut tehtävän mukaan (PDF-sivut, data, kehitys…) yhden litteän listan sijaan.

### PDF
- Yhdistä, jaa, järjestä, sivunumerot
- Pakkaa, lukitse/avaa, metatiedot, litistä
- Vesileima, visuaalinen peitto, kirjoitettu allekirjoitus
- Pura teksti, PDF → kuva-ZIP, kuvat → PDF

### Kuvat
- Pakkaa, skaalaa, rajaa, kierrä/peilaa, favicon-paketti
- Säädä, suodattimet, vesileima
- Muunna JPEG/PNG/WEBP, katso/poista EXIF

### Ääni ja video
- Muunna, leikkaa aaltomuodolla, nopeus/voimakkuus, pura ääni, leike → GIF  
  *(FFmpeg WASM; suuret tiedostot voivat olla hitaita; rajalliset koodekit)*

### Data
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript-rajapinnat
- Muuntokeskus

### Kirjoittaminen
- Markdown ↔ HTML, tekstivertailu, kirjainkoko, Lorem ipsum

### Kehitys
- Pura JWT, Unix-aikaleima, cron, lukujärjestelmä
- Tiiviste (SHA/MD5), regex, väri
- Base64, URL, HTML-entiteetit
- UUID, salasanageneraattori, QR

## Tietosuoja

- Työkalut käsittelevät tiedot **laitteellasi**
- Historia tallentaa vain **yhteenvedot** (ei tiedostosisältöä)
- Asetukset pysyvät paikallisessa tallennuksessa
- [Tietosuojakäytäntö](https://trykit.pages.dev/fi/privacy/) · [Käyttöehdot](https://trykit.pages.dev/fi/terms/)

## Paikallinen kehitys

Vaatimukset: **Node.js 22.13+** (katso `.nvmrc`).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

Avaa http://localhost:3000 — oletuskieli ohjaa osoitteeseen `/en/`.

```bash
npm run build
npm run typecheck
npm run lint
```

### Peruspolku

GitHub-projekti sivuja varten rakenna näin:

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

Paikallisesti ei etuliitettä (`NEXT_PUBLIC_BASE_PATH` tyhjä).

## Julkaise GitHub Pagesissa

### Automaattinen (suositus)

1. Työnnä tämä repositorio osoitteeseen **https://github.com/TGthms/kit**
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. Työnkulku [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) rakentaa `NEXT_PUBLIC_BASE_PATH=/kit` -asetuksella ja julkaisee `out/`

### Manuaalinen

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages-osoite: `https://TGthms.github.io/kit/`  
Kanoninen sivusto: `https://trykit.pages.dev`

## Tekniikka

Next.js 15 (App Router, staattinen vienti) · TypeScript · Tailwind CSS · shadcn-tyylinen UI · Zustand · next-intl · pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA-palvelutyöntekijä

## Lisenssi

[MIT](LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
