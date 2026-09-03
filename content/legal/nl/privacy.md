# Privacybeleid

**Laatst bijgewerkt:** 15 juli 2026

Dit beleid beschrijft hoe informatie wordt verwerkt wanneer je **Kit** gebruikt, een verzameling hulpprogramma's die als statische website is gepubliceerd en in je browser hoort te werken.

## Kernidee

Kit is ontworpen zodat **je bestanden op je eigen apparaat worden verwerkt**. We beheren geen applicatieserver die de inhoud van documenten, afbeeldingen of media die je in de tools opent ontvangt, opslaat of analyseert.

## Wat Kit niet doet

Wanneer je de tools gebruikt (bijvoorbeeld om pdf's samen te voegen of afbeeldingen te comprimeren):

- Je bestanden worden **niet geüpload** naar een Kit-backend voor verwerking.
- We maken **geen gebruikersaccounts**.
- We verkopen **geen persoonsgegevens**.
- We gebruiken **geen advertentie-SDK's of tracking tussen sites voor advertenties**.

## Informatie die rond de dienst kan bestaan

### 1. Gegevens die op je apparaat blijven

Je browser kan lokaal beperkte informatie opslaan, zoals:

- Voorkeuren voor het uiterlijk (licht, donker of systeem)
- Gekozen taal
- Favoriete of vastgezette tools
- **Samenvattingen van de geschiedenis** (gebruikte tool, ongeveer wanneer, korte beschrijving) — **niet** de inhoud van je bestanden
- Voorinstellingen die je kiest om op te slaan

Je kunt de geschiedenis wissen in Instellingen of de gegevens van deze site in je browser verwijderen.

### 2. Netwerk- en hostinglogs

Kit wordt doorgaans gehost als statische bestanden op **Cloudflare Pages** (canonieke site: trykit.pages.dev), met een GitHub Pages-back-up. Wanneer je browser pagina's en assets opvraagt, kan de hostingprovider standaard technische gegevens loggen, zoals IP-adres, user-agent, tijdstempels en opgevraagde URL's. Die logging wordt beheerd door de infrastructuur en het beleid van de host — niet door een Kit-server die je documenten opent.

### 3. Optionele bronnen van derden

PDF-tools laden de pdf.js-worker, lettertypen en bijbehorende bestanden **vanaf deze site** (meegeleverd met de app). Audio- en videotools laden een FFmpeg-WebAssembly-engine **vanaf deze site**. Je bestanden blijven in de browser; die bibliotheken zijn applicatiecode, geen plek waar we je documenten naartoe sturen.

De FFmpeg-engine (`@ffmpeg/core`) valt onder **GPL-2.0-or-later** omdat die codecs bevat zoals H.264 en LAME MP3. Kits eigen broncode blijft MIT. pdf.js en andere bibliotheken houden hun Apache-, BSD- of MIT-licenties.

### 4. Wisselkoersen

Wanneer je wisselkoersen vernieuwt, vraagt deze browser de openbare API van Frankfurter op. Het verzoek kan standaardnetwerkmetadata (zoals IP-adres, user agent, tijdstip en de opgevraagde URL) met Frankfurter delen. Koersen kunnen uit de cache van deze browser komen en verouderd zijn. Het zijn uitsluitend dagelijkse referentiegegevens en geen garantie voor handel, boekhouding, belasting of afwikkeling.

## Progressive Web App (PWA)

Als je Kit installeert of offlinegebruik toestaat, kan een serviceworker **de applicatieschil** (pagina's, scripts, stijlen en pictogrammen) cachen. Kit is niet ontworpen om je persoonlijke bestanden in die cache op te slaan.

## Kinderen

Kit is een hulpprogramma voor algemeen gebruik. Het is niet gericht op kinderen jonger dan 13 jaar en omdat Kit geen accounts aanbiedt, verzamelen we niet bewust persoonsgegevens van kinderen via een registratiesysteem.

## Wijzigingen

We kunnen dit beleid bijwerken wanneer het product of wettelijke vereisten veranderen. We passen dan de datum “Laatst bijgewerkt” aan. Als je Kit na een update blijft gebruiken, betekent dit dat je het herziene beleid hebt bekeken.

## Contact

Vragen over privacy: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Gepubliceerd door **Tim G (GitHub: TGthms)**.
