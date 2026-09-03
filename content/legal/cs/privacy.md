# Zásady ochrany soukromí

**Naposledy aktualizováno:** 15. července 2026

Tyto zásady popisují, jak se nakládá s informacemi, když používáte **Kit**, sadu nástrojů zveřejněnou jako statický web určený ke spuštění ve vašem prohlížeči.

## Základní myšlenka

Kit je navržen tak, aby **práce s vašimi soubory probíhala na vašem zařízení**. Neprovozujeme aplikační server, který by přijímal, ukládal nebo analyzoval obsah dokumentů, obrázků či médií, které v nástrojích otevřete.

## Co Kit nedělá

Když používáte nástroje (například ke slučování PDF nebo komprimování obrázků):

- Vaše soubory se **nenahrávají** na backend Kit za účelem zpracování.
- **Nevytváříme** uživatelské účty.
- **Neprodáváme** osobní údaje.
- **Nepoužíváme** reklamní SDK ani sledování napříč weby pro reklamu.

## Informace, které mohou existovat v souvislosti se službou

### 1. Data, která zůstávají ve vašem zařízení

Prohlížeč může lokálně ukládat omezené informace, například:

- Nastavení vzhledu (světlé, tmavé nebo podle systému)
- Zvolený jazyk
- Oblíbené nebo připnuté nástroje
- **Souhrny historie** (použitý nástroj, přibližný čas, krátký popis) — **nikoli** obsah vašich souborů
- Předvolby, které se rozhodnete uložit

Historii můžete vymazat v Nastavení nebo v prohlížeči odstranit data tohoto webu.

### 2. Síťové a hostingové protokoly

Kit je obvykle hostován jako statické soubory na **Cloudflare Pages** (kanonický web: trykit.pages.dev) se zálohou na GitHub Pages. Když prohlížeč požaduje stránky a zdroje, může poskytovatel hostingu zaznamenávat standardní technické údaje, jako je IP adresa, user agent, časová razítka a požadované adresy URL. Toto zaznamenávání se řídí infrastrukturou a zásadami hostitele — nikoli serverem Kit, který by otevíral vaše dokumenty.

### 3. Volitelné zdroje třetích stran

Nástroje PDF načítají worker pdf.js, písma a související soubory **z tohoto webu** (jsou součástí aplikace). Nástroje pro audio a video načítají engine FFmpeg WebAssembly **z tohoto webu**. Obsah souborů zůstává v prohlížeči; tyto knihovny jsou kódem aplikace, nikoli místem, kam posíláme vaše dokumenty.

Engine FFmpeg (`@ffmpeg/core`) je licencován jako **GPL-2.0-or-later**, protože obsahuje kodeky jako H.264 a LAME MP3. Vlastní zdrojový kód Kit zůstává MIT. pdf.js a další knihovny si ponechávají licence Apache, BSD nebo MIT.

### 4. Měnové kurzy

Při obnovení měnových kurzů se tento prohlížeč dotazuje veřejného API Frankfurter. Požadavek může s Frankfurter sdílet standardní síťová metadata, například IP adresu, user-agent, čas a požadovanou URL. Kurzy mohou pocházet z mezipaměti tohoto prohlížeče a mohou být zastaralé. Jde pouze o denní referenční data, nikoli o záruku pro obchodování, účetnictví, daně nebo vypořádání. Otevření převodníku nebo změna měn může také vyžádat kurz, pokud není čerstvá mezipaměť. Zadané částky se neodesílají.

## Progresivní webová aplikace (PWA)

Pokud Kit nainstalujete nebo povolíte používání offline, může service worker uložit do mezipaměti **aplikační shell** (stránky, skripty, styly a ikony). Kit není navržen k ukládání vašich osobních souborů v této mezipaměti.

## Děti

Kit je nástroj pro obecné použití. Není určen dětem mladším 13 let a protože nenabízí účty, vědomě neshromažďujeme osobní údaje dětí prostřednictvím registračního systému.

## Změny

Tyto zásady můžeme aktualizovat, pokud se změní produkt nebo právní požadavky. Při aktualizaci upravíme datum „Naposledy aktualizováno“. Pokud Kit po aktualizaci nadále používáte, znamená to, že jste se seznámili s revidovanými zásadami.

## Kontakt

Dotazy týkající se soukromí: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Vydal **Tim G (GitHub: TGthms)**.
