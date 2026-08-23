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

Kit je obvykle hostován jako statické soubory (například na GitHub Pages). Když váš prohlížeč požaduje stránky a zdroje, může poskytovatel hostingu automaticky zaznamenávat standardní technické údaje, jako je IP adresa, user agent, časová razítka a požadované adresy URL. Toto zaznamenávání se řídí infrastrukturou a zásadami hostitele — nikoli serverem Kit, který by otevíral vaše dokumenty.

### 3. Volitelné zdroje třetích stran

Některé pokročilé funkce mohou při prvním použití načíst z distribučních sítí obsahu knihovny pro zpracování (například jádra FFmpeg WebAssembly nebo skripty PDF worker). Tyto požadavky mohou síti CDN zpřístupnit standardní síťová metadata. Obsah vašich souborů je stále zpracováván v prohlížeči; CDN poskytuje kód, nikoli vaše dokumenty.

## Progresivní webová aplikace (PWA)

Pokud Kit nainstalujete nebo povolíte používání offline, může service worker uložit do mezipaměti **aplikační shell** (stránky, skripty, styly a ikony). Kit není navržen k ukládání vašich osobních souborů v této mezipaměti.

## Děti

Kit je nástroj pro obecné použití. Není určen dětem mladším 13 let a protože nenabízí účty, vědomě neshromažďujeme osobní údaje dětí prostřednictvím registračního systému.

## Změny

Tyto zásady můžeme aktualizovat, pokud se změní produkt nebo právní požadavky. Při aktualizaci upravíme datum „Naposledy aktualizováno“. Pokud Kit po aktualizaci nadále používáte, znamená to, že jste se seznámili s revidovanými zásadami.

## Kontakt

Dotazy týkající se soukromí: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Vydal **Tim G (GitHub: TGthms)**.
