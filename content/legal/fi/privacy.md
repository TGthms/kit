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

Kit isännöidään yleensä staattisina tiedostoina **Cloudflare Pages** -palvelussa (kanoninen sivusto: trykit.pages.dev), GitHub Pages -varmuuskopion kera. Kun selaimesi pyytää sivuja ja resursseja, isännöintipalveluntarjoaja voi kirjata tavanomaisia teknisiä tietoja, kuten IP-osoitteen, käyttäjäagentin, aikaleimat ja pyydetyt URL-osoitteet. Kirjaamista hallitsevat isännän infrastruktuuri ja käytännöt — ei Kit-palvelin, joka avaisi asiakirjojasi.

### 3. Valinnaiset kolmannen osapuolen resurssit

PDF-työkalut lataavat pdf.js-työntekijän, fontit ja liittyvät tiedostot **tältä sivustolta** (toimitetaan sovelluksen mukana). Ääni- ja videotyökalut lataavat FFmpeg WebAssembly -moottorin **tältä sivustolta**. Tiedostojesi sisältö pysyy selaimessa; kirjastot ovat sovelluskoodia, eivät paikka johon lähetämme asiakirjasi.

FFmpeg-moottori (`@ffmpeg/core`) on lisensoitu **GPL-2.0-or-later** -lisenssillä, koska se sisältää koodekkeja kuten H.264 ja LAME MP3. Kitin oma lähdekoodi pysyy MIT:nä. pdf.js ja muut kirjastot säilyttävät Apache-, BSD- tai MIT-lisenssinsä.

### 4. Valuuttakurssit

Kun päivität valuuttakursseja, tämä selain kysyy tietoja Frankfurterin julkisesta API:sta. Pyyntö voi jakaa Frankfurterin kanssa tavallisia verkkometatietoja, kuten IP-osoitteen, user agentin, ajan ja pyydetyn URL-osoitteen. Kurssit voivat tulla tämän selaimen välimuistista ja olla vanhentuneita. Ne ovat vain päivittäisiä viitetietoja eivätkä takaa kaupankäyntiä, kirjanpitoa, verotusta tai selvitystä. Muuntimen avaaminen tai valuutan vaihto voi myös pyytää kurssia, jos välimuistissa ei ole tuoretta arvoa. Syöttämäsi summat eivät lähde.

## Progressiivinen verkkosovellus (PWA)

Jos asennat Kitin tai sallit offline-käytön, service worker voi tallentaa välimuistiin **sovelluksen rungon** (sivut, skriptit, tyylit ja kuvakkeet). Kitiä ei ole suunniteltu henkilökohtaisten tiedostojesi tallentamiseen tähän välimuistiin.

## Lapset

Kit on yleiskäyttöinen työkalu. Sitä ei ole suunnattu alle 13-vuotiaille, ja koska Kit ei tarjoa käyttäjätilejä, emme tietoisesti kerää lasten henkilötietoja rekisteröintijärjestelmän kautta.

## Muutokset

Voimme päivittää tätä käytäntöä, kun tuote tai lakisääteiset vaatimukset muuttuvat. Päivitämme samalla ”Päivitetty viimeksi” -päivämäärän. Kitin jatkuva käyttö päivityksen jälkeen tarkoittaa, että olet tutustunut tarkistettuun käytäntöön.

## Yhteystiedot

Tietosuojaa koskevat kysymykset: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Julkaisija **Tim G (GitHub: TGthms)**.
