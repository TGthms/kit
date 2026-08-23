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

Kit hostes vanligvis som statiske filer (for eksempel på GitHub Pages). Når nettleseren din ber om sider og ressurser, kan verten automatisk logge standard tekniske data som IP-adresse, brukeragent, tidsstempler og forespurte URL-er. Denne loggføringen styres av vertens infrastruktur og retningslinjer — ikke av en Kit-server som åpner dokumentene dine.

### 3. Valgfrie tredjepartsressurser

Enkelte avanserte funksjoner kan laste inn behandlingsbiblioteker (for eksempel FFmpeg WebAssembly-kjerner eller PDF-worker-skript) fra innholdsleveringsnettverk første gang du bruker dem. Disse forespørslene kan eksponere standard nettverksmetadata for CDN-et. Filinnholdet behandles fortsatt i nettleseren; CDN-et leverer kode, ikke dokumentene dine.

## Progressiv nettapp (PWA)

Hvis du installerer Kit eller tillater bruk uten nett, kan en service worker bufre **programmets skall** (sider, skript, stiler og ikoner). Kit er ikke utformet for å lagre personlige filer i denne bufferen.

## Barn

Kit er et verktøy for allmenn bruk. Det er ikke rettet mot barn under 13 år, og siden Kit ikke tilbyr kontoer, samler vi ikke bevisst inn barns personopplysninger gjennom et registreringssystem.

## Endringer

Vi kan oppdatere denne erklæringen når produktet eller juridiske krav endres. Da reviderer vi datoen for «Sist oppdatert». Hvis du fortsetter å bruke Kit etter en oppdatering, betyr det at du har gjennomgått den reviderte erklæringen.

## Kontakt

Personvernspørsmål: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publisert av **Tim G (GitHub: TGthms)**.
