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

A Kitet általában statikus fájlként tárolják (például a GitHub Pagesen). Amikor a böngészője oldalakat és erőforrásokat kér, a tárhelyszolgáltató automatikusan naplózhat szabványos technikai adatokat, például IP-címet, felhasználói ügynököt, időbélyegeket és a kért URL-eket. Ezt a naplózást a tárhelyszolgáltató infrastruktúrája és szabályzatai vezérlik, nem pedig egy, a dokumentumait megnyitó Kit-szerver.

### 3. Opcionális külső erőforrások

Egyes speciális funkciók első használatkor feldolgozókönyvtárakat (például FFmpeg WebAssembly-magokat vagy PDF worker-szkripteket) tölthetnek be tartalomkézbesítési hálózatokról. Ezek a kérések szabványos hálózati metaadatokat tehetnek elérhetővé a CDN számára. A fájlok tartalmának feldolgozása továbbra is a böngészőben történik; a CDN kódot, nem pedig az Ön dokumentumait szolgáltatja.

## Progresszív webalkalmazás (PWA)

Ha telepíti a Kitet vagy engedélyezi az offline használatot, egy service worker gyorsítótárazhatja **az alkalmazás héját** (oldalakat, szkripteket, stílusokat és ikonokat). A Kitet nem úgy terveztük, hogy személyes fájlokat tároljon ebben a gyorsítótárban.

## Gyermekek

A Kit általános célú segédprogram. Nem 13 év alatti gyermekeknek szól, és mivel a Kit nem kínál fiókokat, regisztrációs rendszeren keresztül tudatosan nem gyűjtünk gyermekektől személyes adatokat.

## Módosítások

Ezt a szabályzatot frissíthetjük, ha a termék vagy a jogi követelmények változnak. Ilyenkor módosítjuk az „Utoljára frissítve” dátumot. A Kit frissítés utáni további használata azt jelenti, hogy megismerte a módosított szabályzatot.

## Kapcsolat

Adatvédelmi kérdések: [Rólam](https://t-g.pages.dev).

Közzétette: **Tim G (GitHub: TGthms)**.
