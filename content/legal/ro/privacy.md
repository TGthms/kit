# Politica de confidențialitate

**Ultima actualizare:** 15 iulie 2026

Această politică descrie modul în care sunt gestionate informațiile atunci când utilizați **Kit**, o colecție de utilitare publicată ca site static și concepută să ruleze în browserul dumneavoastră.

## Ideea de bază

Kit este conceput astfel încât **lucrul cu fișierele dumneavoastră să aibă loc pe dispozitivul dumneavoastră**. Nu operăm un server de aplicații care primește, stochează sau analizează conținutul documentelor, imaginilor sau fișierelor media pe care le deschideți în instrumente.

## Ce nu face Kit

Când utilizați instrumentele (de exemplu, pentru îmbinarea PDF-urilor sau comprimarea imaginilor):

- Fișierele dumneavoastră **nu sunt încărcate** într-un backend Kit pentru procesare.
- **Nu** creăm conturi de utilizator.
- **Nu** vindem date cu caracter personal.
- **Nu** folosim SDK-uri de publicitate sau urmărire între site-uri în scopuri publicitare.

## Informații care pot exista în jurul serviciului

### 1. Date care rămân pe dispozitivul dumneavoastră

Browserul poate stoca local informații limitate, precum:

- Preferințe de aspect (luminos, întunecat sau sistem)
- Limba aleasă
- Instrumente favorite sau fixate
- **Rezumatul istoricului** (instrumentul utilizat, momentul aproximativ, o scurtă descriere) — **nu** conținutul fișierelor dumneavoastră
- Presetări pe care alegeți să le salvați

Puteți șterge istoricul din Setări sau puteți șterge datele acestui site din browser.

### 2. Jurnale de rețea și găzduire

Kit este găzduit de obicei ca fișiere statice (de exemplu, pe GitHub Pages). Când browserul solicită pagini și resurse, gazda poate înregistra automat date tehnice standard, precum adresa IP, agentul utilizatorului, marcaje temporale și URL-urile solicitate. Înregistrarea este controlată de infrastructura și politicile gazdei, nu de un server Kit care deschide documentele dumneavoastră.

### 3. Resurse opționale ale terților

Unele funcții avansate pot încărca biblioteci de procesare (de exemplu, nuclee FFmpeg WebAssembly sau scripturi worker pentru PDF) din rețele de distribuție a conținutului la prima utilizare. Aceste solicitări pot expune metadate de rețea standard către CDN. Conținutul fișierelor este procesat în continuare în browser; CDN-ul furnizează cod, nu documentele dumneavoastră.

### 4. Cursuri valutare

Când reîmprospătezi cursurile valutare, acest browser interoghează API-ul public Frankfurter. Cererea poate partaja cu Frankfurter metadate standard de rețea, precum adresa IP, user agent, ora și URL-ul solicitat. Cursurile pot proveni din cache-ul acestui browser și pot fi învechite. Sunt doar date de referință zilnice, nu o garanție pentru tranzacționare, contabilitate, taxe sau decontare.

## Aplicație web progresivă (PWA)

Dacă instalați Kit sau permiteți utilizarea offline, un service worker poate stoca în cache **shell-ul aplicației** (pagini, scripturi, stiluri și pictograme). Kit nu este conceput pentru a stoca fișierele dumneavoastră personale în acel cache.

## Copii

Kit este un utilitar de uz general. Nu se adresează copiilor sub 13 ani și, deoarece Kit nu oferă conturi, nu colectăm cu bună știință date cu caracter personal ale copiilor printr-un sistem de înregistrare.

## Modificări

Putem actualiza această politică atunci când se modifică produsul sau cerințele legale. Atunci vom revizui data „Ultima actualizare”. Continuarea utilizării Kit după o actualizare înseamnă că ați consultat politica revizuită.

## Contact

Întrebări despre confidențialitate: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publicat de **Tim G (GitHub: TGthms)**.
