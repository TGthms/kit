# Personvernerklæring

**Sist oppdatert:** 15. juli 2026

Denne erklæringen beskriver hvordan informasjon håndteres når du bruker **Kit**, en samling verktøy som er publisert som et statisk nettsted og er laget for å kjøre i nettleseren din.

## Hovedidé

Kit er utformet slik at **arbeid med filene dine skjer på enheten din**. Vi driver ikke en applikasjonsserver som mottar, lagrer eller analyserer innholdet i dokumenter, bilder eller medier du åpner i verktøyene.

## Hva Kit ikke gjør

Når du bruker verktøyene (for eksempel til å slå sammen PDF-filer eller komprimere bilder):

- Filene dine blir **ikke lastet opp** til en Kit-backend for behandling.
- Vi oppretter **ikke brukerkontoer**.
- Vi selger **ikke personopplysninger**.
- Vi bruker **ikke annonserings-SDK-er eller sporing på tvers av nettsteder for annonser**.

## Informasjon som kan finnes rundt tjenesten

### 1. Data som blir på enheten din

Nettleseren din kan lagre begrenset informasjon lokalt, for eksempel:

- Utseendeinnstillinger (lys, mørk eller system)
- Valgt språk
- Favoritter eller festede verktøy
- **Historikksammendrag** (hvilket verktøy du brukte, omtrent når, en kort beskrivelse) — **ikke** innholdet i filene dine
- Forhåndsinnstillinger du velger å lagre

Du kan tømme historikken i Innstillinger eller slette dataene til dette nettstedet i nettleseren.

### 2. Nettverks- og hostinglogger

Kit hostes vanligvis som statiske filer på **Cloudflare Pages** (kanonisk nettsted: trykit.pages.dev), med en GitHub Pages-sikkerhetskopi. Når nettleseren din ber om sider og ressurser, kan verten automatisk logge standard tekniske data som IP-adresse, brukeragent, tidsstempler og forespurte URL-er. Denne loggføringen styres av vertens infrastruktur og retningslinjer — ikke av en Kit-server som åpner dokumentene dine.

### 3. Valgfrie tredjepartsressurser

PDF-verktøy laster pdf.js-workeren, skrifter og relaterte filer **fra dette nettstedet** (levert med appen). Lyd- og videoverktøy laster en FFmpeg WebAssembly-motor **fra dette nettstedet**. Filinnholdet blir i nettleseren; bibliotekene er programkode, ikke et sted vi sender dokumentene dine.

FFmpeg-motoren (`@ffmpeg/core`) er lisensiert som **GPL-2.0-or-later** fordi den inneholder kodeker som H.264 og LAME MP3. Kits egen kildekode forblir MIT. pdf.js og øvrige biblioteker beholder Apache-, BSD- eller MIT-lisensene sine.

### 4. Valutakurser

Når du oppdaterer valutakurser, spør denne nettleseren Frankfurters offentlige API. Forespørselen kan dele standard nettverksmetadata (for eksempel IP-adresse, user agent, tidspunkt og forespurt URL) med Frankfurter. Kurser kan komme fra hurtigbufferet i denne nettleseren og kan være utdaterte. De er bare daglige referansedata og er ingen garanti for handel, regnskap, skatt eller oppgjør.

## Progressiv nettapp (PWA)

Hvis du installerer Kit eller tillater bruk uten nett, kan en service worker bufre **programmets skall** (sider, skript, stiler og ikoner). Kit er ikke utformet for å lagre personlige filer i denne bufferen.

## Barn

Kit er et verktøy for allmenn bruk. Det er ikke rettet mot barn under 13 år, og siden Kit ikke tilbyr kontoer, samler vi ikke bevisst inn barns personopplysninger gjennom et registreringssystem.

## Endringer

Vi kan oppdatere denne erklæringen når produktet eller juridiske krav endres. Da reviderer vi datoen for «Sist oppdatert». Hvis du fortsetter å bruke Kit etter en oppdatering, betyr det at du har gjennomgått den reviderte erklæringen.

## Kontakt

Personvernspørsmål: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publisert av **Tim G (GitHub: TGthms)**.
