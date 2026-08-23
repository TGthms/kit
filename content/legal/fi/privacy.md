# Tietosuojakäytäntö

**Päivitetty viimeksi:** 15. heinäkuuta 2026

Tässä käytännössä kuvataan, miten tietoja käsitellään, kun käytät **Kitiä**, staattisena verkkosivustona julkaistua työkalukokoelmaa, joka on suunniteltu toimimaan selaimessasi.

## Perusajatus

Kit on suunniteltu niin, että **tiedostojesi käsittely tapahtuu laitteellasi**. Emme käytä sovelluspalvelinta, joka vastaanottaa, tallentaa tai analysoi työkaluissa avaamiesi asiakirjojen, kuvien tai median sisältöä.

## Mitä Kit ei tee

Kun käytät työkaluja (esimerkiksi PDF-tiedostojen yhdistämiseen tai kuvien pakkaamiseen):

- Tiedostojasi **ei ladata** Kit-taustapalveluun käsiteltäviksi.
- Emme luo **käyttäjätilejä**.
- Emme myy **henkilötietoja**.
- Emme käytä **mainos-SDK:ita tai sivustojen välistä seurantaa mainontaan**.

## Palvelun yhteydessä mahdollisesti olevat tiedot

### 1. Laitteellesi jäävät tiedot

Selaimesi voi tallentaa paikallisesti rajallisia tietoja, kuten:

- Ulkoasuasetukset (vaalea, tumma tai järjestelmän mukainen)
- Valittu kieli
- Suosikit tai kiinnitetyt työkalut
- **Historian yhteenvedot** (käytetty työkalu, suunnilleen milloin, lyhyt kuvaus) — **ei** tiedostojesi sisältöä
- Tallennettavaksi valitsemasi esiasetukset

Voit tyhjentää historian asetuksista tai poistamalla tämän sivuston tiedot selaimesta.

### 2. Verkko- ja isännöintilokit

Kit isännöidään yleensä staattisina tiedostoina (esimerkiksi GitHub Pages -palvelussa). Kun selaimesi pyytää sivuja ja resursseja, isännöintipalveluntarjoaja voi kirjata tavanomaisia teknisiä tietoja, kuten IP-osoitteen, käyttäjäagentin, aikaleimat ja pyydetyt URL-osoitteet. Kirjaamista hallitsevat isännän infrastruktuuri ja käytännöt — ei Kit-palvelin, joka avaisi asiakirjojasi.

### 3. Valinnaiset kolmannen osapuolen resurssit

Jotkin edistyneet ominaisuudet voivat ladata käsittelykirjastoja (esimerkiksi FFmpeg WebAssembly -ytimiä tai PDF-työntekijäskriptejä) sisältöjakeluverkoista, kun käytät niitä ensimmäisen kerran. Pyynnöt voivat paljastaa CDN:lle tavanomaisia verkkotietoja. Tiedostojesi sisältö käsitellään edelleen selaimessa; CDN toimittaa koodia, ei asiakirjojasi.

## Progressiivinen verkkosovellus (PWA)

Jos asennat Kitin tai sallit offline-käytön, service worker voi tallentaa välimuistiin **sovelluksen rungon** (sivut, skriptit, tyylit ja kuvakkeet). Kitiä ei ole suunniteltu henkilökohtaisten tiedostojesi tallentamiseen tähän välimuistiin.

## Lapset

Kit on yleiskäyttöinen työkalu. Sitä ei ole suunnattu alle 13-vuotiaille, ja koska Kit ei tarjoa käyttäjätilejä, emme tietoisesti kerää lasten henkilötietoja rekisteröintijärjestelmän kautta.

## Muutokset

Voimme päivittää tätä käytäntöä, kun tuote tai lakisääteiset vaatimukset muuttuvat. Päivitämme samalla ”Päivitetty viimeksi” -päivämäärän. Kitin jatkuva käyttö päivityksen jälkeen tarkoittaa, että olet tutustunut tarkistettuun käytäntöön.

## Yhteystiedot

Tietosuojaa koskevat kysymykset: [Tietoa minusta](https://t-g.pages.dev).

Julkaisija **Tim G (GitHub: TGthms)**.
