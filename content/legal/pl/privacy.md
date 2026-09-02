# Polityka prywatności

**Ostatnia aktualizacja:** 15 lipca 2026 r.

Niniejsza polityka opisuje sposób przetwarzania informacji podczas korzystania z **Kit** — zestawu narzędzi opublikowanego jako statyczna strona internetowa i przeznaczonego do działania w przeglądarce.

## Najważniejsza zasada

Kit zaprojektowano tak, aby **praca na plikach odbywała się na Twoim urządzeniu**. Nie prowadzimy serwera aplikacji, który odbiera, przechowuje lub analizuje zawartość dokumentów, obrazów ani materiałów otwieranych przez Ciebie w narzędziach.

## Czego Kit nie robi

Podczas korzystania z narzędzi (na przykład łączenia plików PDF lub kompresowania obrazów):

- Twoje pliki **nie są przesyłane** do backendu Kit w celu przetwarzania.
- **Nie** tworzymy kont użytkowników.
- **Nie** sprzedajemy danych osobowych.
- **Nie** używamy reklamowych SDK ani śledzenia między witrynami do celów reklamowych.

## Informacje, które mogą istnieć w otoczeniu usługi

### 1. Dane pozostające na Twoim urządzeniu

Przeglądarka może lokalnie przechowywać ograniczone informacje, takie jak:

- Preferencje wyglądu (jasny, ciemny lub systemowy)
- Wybrany język
- Ulubione lub przypięte narzędzia
- **Podsumowania historii** (użyte narzędzie, przybliżony czas, krótki opis) — **nie** zawartość Twoich plików
- Presety wybrane przez Ciebie do zapisania

Historię możesz wyczyścić w Ustawieniach albo usunąć dane tej witryny w przeglądarce.

### 2. Dzienniki sieciowe i hostingowe

Kit jest zwykle hostowany jako pliki statyczne na **Cloudflare Pages** (kanoniczna strona: trykit.pages.dev), z kopią na GitHub Pages. Gdy przeglądarka żąda stron i zasobów, dostawca hostingu może automatycznie rejestrować standardowe dane techniczne, takie jak adres IP, agent użytkownika, znaczniki czasu i żądane adresy URL. Rejestrowanie jest kontrolowane przez infrastrukturę i zasady hosta, a nie przez serwer Kit otwierający Twoje dokumenty.

### 3. Opcjonalne zasoby stron trzecich

Narzędzia PDF ładują worker pdf.js, czcionki i powiązane pliki **z tej witryny** (dołączone do aplikacji). Narzędzia audio i wideo ładują silnik FFmpeg WebAssembly **z tej witryny**. Zawartość plików zostaje w przeglądarce; te biblioteki to kod aplikacji, nie miejsce, do którego wysyłamy Twoje dokumenty.

### 4. Kursy walut

Po odświeżeniu kursów walut ta przeglądarka wysyła zapytanie do publicznego API Frankfurter. Żądanie może udostępniać Frankfurter standardowe metadane sieciowe, takie jak adres IP, user agent, czas i żądany URL. Kursy mogą pochodzić z pamięci podręcznej tej przeglądarki i być nieaktualne. Są wyłącznie dziennymi danymi referencyjnymi, a nie gwarancją do celów handlowych, księgowych, podatkowych ani rozliczeniowych.

## Progresywna aplikacja internetowa (PWA)

Jeśli zainstalujesz Kit lub zezwolisz na korzystanie offline, service worker może buforować **powłokę aplikacji** (strony, skrypty, style i ikony). Kit nie jest przeznaczony do przechowywania osobistych plików w tej pamięci podręcznej.

## Dzieci

Kit jest narzędziem ogólnego przeznaczenia. Nie jest skierowany do dzieci poniżej 13 lat, a ponieważ Kit nie oferuje kont, nie zbieramy świadomie danych osobowych dzieci za pośrednictwem systemu rejestracji.

## Zmiany

Możemy aktualizować tę politykę, gdy zmieni się produkt lub wymagania prawne. W takim przypadku zmienimy datę „Ostatnia aktualizacja”. Dalsze korzystanie z Kit po aktualizacji oznacza, że zapoznałeś(-aś) się ze zmienioną polityką.

## Kontakt

Pytania dotyczące prywatności: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Opublikowano przez **Tim G (GitHub: TGthms)**.
