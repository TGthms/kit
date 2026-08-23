# Privatlivspolitik

**Senest opdateret:** 15. juli 2026

Denne politik beskriver, hvordan oplysninger håndteres, når du bruger **Kit**, en samling hjælpeværktøjer, der er udgivet som et statisk websted og er beregnet til at køre i din browser.

## Grundidé

Kit er designet, så **arbejdet med dine filer foregår på din enhed**. Vi driver ikke en applikationsserver, der modtager, gemmer eller analyserer indholdet af dokumenter, billeder eller medier, som du åbner i værktøjerne.

## Hvad Kit ikke gør

Når du bruger værktøjerne (for eksempel til at flette PDF-filer eller komprimere billeder):

- Dine filer bliver **ikke uploadet** til en Kit-backend til behandling.
- Vi opretter **ikke brugerkonti**.
- Vi sælger **ikke personoplysninger**.
- Vi bruger **ikke reklame-SDK'er eller sporing på tværs af websteder til reklamer**.

## Oplysninger, der kan findes omkring tjenesten

### 1. Data, der bliver på din enhed

Din browser kan gemme begrænsede oplysninger lokalt, f.eks.:

- Indstillinger for udseende (lys, mørk eller system)
- Valgt sprog
- Favoritter eller fastgjorte værktøjer
- **Historikoversigter** (hvilket værktøj du brugte, omtrent hvornår, en kort beskrivelse) — **ikke** indholdet af dine filer
- Forudindstillinger, du vælger at gemme

Du kan rydde historikken i Indstillinger eller slette dette websteds data i din browser.

### 2. Netværks- og hostinglogfiler

Kit hostes typisk som statiske filer (for eksempel på GitHub Pages). Når din browser anmoder om sider og ressourcer, kan hosten automatisk logge standardtekniske data som IP-adresse, user agent, tidsstempler og anmodede URL'er. Denne logning styres af hostens infrastruktur og politikker — ikke af en Kit-server, der åbner dine dokumenter.

### 3. Valgfrie ressourcer fra tredjeparter

Nogle avancerede funktioner kan indlæse behandlingsbiblioteker (for eksempel FFmpeg WebAssembly-kerner eller PDF-worker-scripts) fra indholdsleveringsnetværk, første gang du bruger dem. Disse anmodninger kan afsløre standardnetværksmetadata for CDN'et. Dine filer behandles stadig i browseren; CDN'et leverer biblioteks-kode, ikke dine dokumenter.

## Progressiv webapp (PWA)

Hvis du installerer Kit eller tillader offlinebrug, kan en service worker cache **programmets skal** (sider, scripts, typografi og ikoner). Kit er ikke designet til at gemme dine personlige filer i denne cache.

## Børn

Kit er et værktøj til almindelig brug. Det er ikke rettet mod børn under 13 år, og fordi Kit ikke tilbyder konti, indsamler vi ikke bevidst børns personoplysninger gennem et registreringssystem.

## Ændringer

Vi kan opdatere denne politik, når produktet eller de juridiske krav ændrer sig. Vi ændrer datoen for “Senest opdateret”, når vi gør det. Fortsat brug af Kit efter en opdatering betyder, at du har gennemgået den reviderede politik.

## Kontakt

Spørgsmål om privatliv: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Udgivet af **Tim G (GitHub: TGthms)**.
