# Adatvédelmi szabályzat

**Utoljára frissítve:** 2026. július 15.

Ez a szabályzat azt ismerteti, hogyan kezeljük az információkat a **Kit** használata során. A Kit segédprogramok gyűjteménye, amelyet statikus webhely formájában teszünk közzé, és amelyet böngészőben való futásra terveztünk.

## Alapgondolat

A Kitet úgy terveztük, hogy **a fájlokkal végzett munka az Ön eszközén történjen**. Nem működtetünk olyan alkalmazásszervert, amely fogadja, tárolja vagy elemzi az eszközökben megnyitott dokumentumok, képek vagy média tartalmát.

## Amit a Kit nem tesz

Az eszközök használatakor (például PDF-ek egyesítésekor vagy képek tömörítésekor):

- A fájlokat **nem töltjük fel** Kit-háttérrendszerbe feldolgozás céljából.
- **Nem** hozunk létre felhasználói fiókokat.
- **Nem** értékesítünk személyes adatokat.
- **Nem** használunk hirdetési SDK-kat vagy webhelyek közötti követést hirdetési célokra.

## A szolgáltatás környezetében esetlegesen létező információk

### 1. Az eszközén maradó adatok

A böngészője korlátozott információkat tárolhat helyben, például:

- Megjelenési beállítások (világos, sötét vagy rendszerbeállítás)
- Választott nyelv
- Kedvencek vagy rögzített eszközök
- **Előzmény-összefoglalók** (használt eszköz, hozzávetőleges időpont, rövid leírás) — **nem** a fájlok tartalma
- Az Ön által menteni kívánt készletek

Az előzményeket a Beállításokban törölheti, vagy a böngészőben törölheti a webhely adatait.

### 2. Hálózati és tárhelyszolgáltatói naplók

A Kitet általában statikus fájlként a **Cloudflare Pagesen** tárolják (hivatalos oldal: trykit.pages.dev), GitHub Pages-mentéssel. Amikor a böngészője oldalakat és erőforrásokat kér, a tárhelyszolgáltató automatikusan naplózhat szabványos technikai adatokat, például IP-címet, felhasználói ügynököt, időbélyegeket és a kért URL-eket. Ezt a naplózást a tárhelyszolgáltató infrastruktúrája és szabályzatai vezérlik, nem pedig egy, a dokumentumait megnyitó Kit-szerver.

### 3. Opcionális külső erőforrások

A PDF-eszközök a pdf.js workert, a betűkészleteket és a kapcsolódó fájlokat **erről a webhelyről** töltik be (az alkalmazással együtt járnak). A hang- és videóeszközök egy FFmpeg WebAssembly-motort töltenek be **erről a webhelyről**. A fájlok tartalma a böngészőben marad; ezek a könyvtárak alkalmazáskód, nem olyan hely, ahová a dokumentumait küldenénk.

Az FFmpeg motor (`@ffmpeg/core`) **GPL-2.0-or-later** licencű, mert H.264 és LAME MP3 kodekeket tartalmaz. A Kit saját forráskódja MIT marad. A pdf.js és a többi könyvtár Apache, BSD vagy MIT licencet tart.

### 4. Árfolyamok

Az árfolyamok frissítésekor ez a böngésző lekérdezi a Frankfurter nyilvános API-ját. A kérés szabványos hálózati metaadatokat, például IP-címet, user agentet, időpontot és a kért URL-t is megoszthatja a Frankfurterrel. Az árfolyamok származhatnak a böngésző gyorsítótárából, ezért elavultak lehetnek. Ezek kizárólag napi referenciaadatok, és nem jelentenek garanciát kereskedési, könyvelési, adózási vagy elszámolási célokra. A váltó megnyitása vagy a pénznem váltása is kérhet árfolyamot, ha nincs friss gyorsítótár. A begépelt összegek nem mennek el.

## Progresszív webalkalmazás (PWA)

Ha telepíti a Kitet vagy engedélyezi az offline használatot, egy service worker gyorsítótárazhatja **az alkalmazás héját** (oldalakat, szkripteket, stílusokat és ikonokat). A Kitet nem úgy terveztük, hogy személyes fájlokat tároljon ebben a gyorsítótárban.

## Gyermekek

A Kit általános célú segédprogram. Nem 13 év alatti gyermekeknek szól, és mivel a Kit nem kínál fiókokat, regisztrációs rendszeren keresztül tudatosan nem gyűjtünk gyermekektől személyes adatokat.

## Módosítások

Ezt a szabályzatot frissíthetjük, ha a termék vagy a jogi követelmények változnak. Ilyenkor módosítjuk az „Utoljára frissítve” dátumot. A Kit frissítés utáni további használata azt jelenti, hogy megismerte a módosított szabályzatot.

## Kapcsolat

Adatvédelmi kérdések: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Közzétette: **Tim G (GitHub: TGthms)**.
