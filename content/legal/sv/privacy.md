# Integritetspolicy

**Senast uppdaterad:** 15 juli 2026

Den här policyn beskriver hur information hanteras när du använder **Kit**, en samling verktyg som publiceras som en statisk webbplats och är avsedd att köras i din webbläsare.

## Grundidé

Kit är utformat så att **arbete med dina filer sker på din enhet**. Vi driver inte någon applikationsserver som tar emot, lagrar eller analyserar innehållet i dokument, bilder eller medier som du öppnar i verktygen.

## Vad Kit inte gör

När du använder verktygen (till exempel för att slå ihop PDF-filer eller komprimera bilder):

- Dina filer **laddas inte upp** till en Kit-backend för bearbetning.
- Vi skapar **inga användarkonton**.
- Vi säljer **inte personuppgifter**.
- Vi använder **inga annons-SDK:er eller spårning mellan webbplatser för annonser**.

## Information som kan finnas runt tjänsten

### 1. Data som stannar på din enhet

Din webbläsare kan lagra begränsad information lokalt, till exempel:

- Inställningar för utseende (ljust, mörkt eller system)
- Valt språk
- Favoriter eller fästa verktyg
- **Historiksammanfattningar** (vilket verktyg du använde, ungefär när, en kort beskrivning) — **inte** innehållet i dina filer
- Förinställningar som du väljer att spara

Du kan rensa historiken i Inställningar eller ta bort den här webbplatsens data i webbläsaren.

### 2. Nätverks- och hostingloggar

Kit hostas vanligtvis som statiska filer på **Cloudflare Pages** (kanonisk sajt: trykit.pages.dev), med en GitHub Pages-säkerhetskopia. När din webbläsare begär sidor och resurser kan värden automatiskt logga tekniska standarduppgifter som IP-adress, user agent, tidsstämplar och begärda URL:er. Den loggningen styrs av värdens infrastruktur och policyer — inte av en Kit-server som öppnar dina dokument.

### 3. Valfria resurser från tredje part

PDF-verktyg läser in pdf.js-workern, typsnitt och relaterade filer **från den här sajten** (följer med appen). Ljud- och videoverktyg läser in en FFmpeg WebAssembly-motor **från den här sajten**. Filinnehållet stannar i webbläsaren; biblioteken är programkod, inte en plats dit vi skickar dina dokument.

### 4. Valutakurser

När du uppdaterar valutakurser frågar den här webbläsaren Frankfurters offentliga API. Begäran kan dela standardmässiga nätverksmetadata (till exempel IP-adress, user agent, tid och begärd URL) med Frankfurter. Kurser kan komma från webbläsarens cache och vara inaktuella. De är endast dagliga referensdata och ingen garanti för handel, bokföring, skatt eller avveckling.

## Progressiv webbapp (PWA)

Om du installerar Kit eller tillåter offlineanvändning kan en service worker cachelagra **programmets skal** (sidor, skript, stilmallar och ikoner). Kit är inte utformat för att lagra dina personliga filer i den cachen.

## Barn

Kit är ett verktyg för allmän användning. Det riktar sig inte till barn under 13 år, och eftersom Kit inte erbjuder konton samlar vi inte medvetet in barns personuppgifter genom ett registreringssystem.

## Ändringar

Vi kan uppdatera den här policyn när produkten eller juridiska krav ändras. Då ändrar vi datumet ”Senast uppdaterad”. Om du fortsätter att använda Kit efter en uppdatering betyder det att du har granskat den reviderade policyn.

## Kontakt

Frågor om integritet: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publicerad av **Tim G (GitHub: TGthms)**.
