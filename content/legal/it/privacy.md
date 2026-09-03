# Informativa sulla privacy

**Ultimo aggiornamento:** 15 luglio 2026

Questa informativa descrive come vengono gestite le informazioni quando utilizzi **Kit**, una raccolta di utilità pubblicata come sito web statico e progettata per funzionare nel tuo browser.

## Idea centrale

Kit è progettato affinché **il lavoro sui tuoi file avvenga sul tuo dispositivo**. Non gestiamo un server applicativo che riceva, memorizzi o analizzi il contenuto di documenti, immagini o contenuti multimediali che apri negli strumenti.

## Cosa non fa Kit

Quando utilizzi gli strumenti (ad esempio per unire PDF o comprimere immagini):

- I tuoi file **non vengono caricati** su un backend di Kit per essere elaborati.
- **Non** creiamo account utente.
- **Non** vendiamo dati personali.
- **Non** utilizziamo SDK pubblicitari né sistemi di tracciamento tra siti per la pubblicità.

## Informazioni che possono esistere nell'ambito del servizio

### 1. Dati che restano sul tuo dispositivo

Il browser può memorizzare localmente informazioni limitate, come:

- Preferenze di aspetto (chiaro, scuro o sistema)
- Lingua scelta
- Strumenti preferiti o fissati
- **Riepiloghi della cronologia** (strumento utilizzato, momento approssimativo, breve descrizione) — **non** il contenuto dei tuoi file
- Preimpostazioni che scegli di salvare

Puoi cancellare la cronologia nelle Impostazioni oppure eliminare i dati di questo sito dal browser.

### 2. Log di rete e hosting

Kit è generalmente ospitato come file statici su **Cloudflare Pages** (sito canonico: trykit.pages.dev), con una copia di riserva su GitHub Pages. Quando il browser richiede pagine e risorse, il provider di hosting può registrare dati tecnici standard come indirizzo IP, user agent, timestamp e URL richiesti. Questa registrazione è regolata dall'infrastruttura e dalle politiche del provider, non da un server Kit che apre i tuoi documenti.

### 3. Risorse facoltative di terze parti

Gli strumenti PDF caricano il worker pdf.js, i font e le risorse collegate **da questo stesso sito** (inclusi nell’app). Gli strumenti audio e video caricano un motore FFmpeg WebAssembly **da questo stesso sito**. Il contenuto dei file resta nel browser; queste librerie sono codice dell’applicazione, non un luogo a cui inviamo i tuoi documenti.

Il motore FFmpeg (`@ffmpeg/core`) è concesso in **GPL-2.0-or-later** perché include codec come H.264 e LAME MP3. Il codice sorgente di Kit resta MIT. pdf.js e le altre librerie mantengono le proprie licenze Apache, BSD o MIT.

### 4. Tassi di cambio

Quando aggiorni i tassi di cambio, questo browser interroga l'API pubblica di Frankfurter. La richiesta può condividere con Frankfurter metadati di rete standard, come indirizzo IP, user agent, ora e URL richiesto. I tassi possono provenire dalla cache di questo browser ed essere obsoleti. Sono solo dati di riferimento giornalieri e non costituiscono una garanzia per trading, contabilità, imposte o regolamento. Aprire il convertitore o cambiare valute può richiedere un tasso se non c’è una cache recente. Gli importi digitati non vengono inviati.

## Progressive Web App (PWA)

Se installi Kit o consenti l'uso offline, un service worker può memorizzare nella cache **il guscio dell'applicazione** (pagine, script, stili, icone). Kit non è progettato per conservare i tuoi file personali in quella cache.

## Minori

Kit è un'utilità per uso generale. Non è rivolta a minori di 13 anni e, poiché Kit non offre account, non raccogliamo consapevolmente informazioni personali di minori tramite un sistema di registrazione.

## Modifiche

Potremmo aggiornare questa informativa quando cambiano il prodotto o i requisiti legali. In tal caso modificheremo la data «Ultimo aggiornamento». Continuare a usare Kit dopo un aggiornamento significa che hai preso visione dell'informativa revisionata.

## Contatti

Domande sulla privacy: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Pubblicato da **Tim G (GitHub: TGthms)**.
