#!/usr/bin/env python3
"""Apply the localization polish pass to every catalog.

Fill missing/English leftover user-facing strings. Force-update compress copy
so non-English names match the rasterize meaning. Does not rewrite proper
nouns (city names) or intentional format labels (Markdown ↔ HTML).
"""
from __future__ import annotations

import json
from pathlib import Path

from polish_copy import DATE_CALC, GREETING_DISTINCT_PATHS, GREETING_LATER

ROOT = Path(__file__).resolve().parents[2]
MESSAGES = ROOT / "messages"

LOCALES = [
    "ar", "cs", "da", "de", "el", "es", "fi", "fr", "he", "hi", "hu", "id", "it",
    "ja", "ko", "nb", "nl", "pl", "pt-BR", "pt-PT", "ro", "ru", "sv", "th", "tr",
    "uk", "vi", "zh-Hans", "zh-Hant",
]

def deep_set(obj: dict, path: str, value: str) -> None:
    parts = path.split(".")
    cur = obj
    for part in parts[:-1]:
        nxt = cur.get(part)
        if not isinstance(nxt, dict):
            nxt = {}
            cur[part] = nxt
        cur = nxt
    cur[parts[-1]] = value

def deep_get(obj: dict, path: str):
    cur = obj
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur

# locale -> path -> string
# Keep {label}, {value}, {count}, {day} placeholders intact.
T: dict[str, dict[str, str]] = {}

def put(path: str, mapping: dict[str, str]) -> None:
    for loc, value in mapping.items():
        T.setdefault(loc, {})[path] = value

def row(path: str, values: dict[str, str]) -> None:
    put(path, values)

# --- common search (SearchableSelect) ---
row("common.search", {
    "ar": "بحث", "cs": "Hledat", "da": "Søg", "de": "Suchen", "el": "Αναζήτηση",
    "es": "Buscar", "fi": "Hae", "fr": "Rechercher", "he": "חיפוש", "hi": "खोजें",
    "hu": "Keresés", "id": "Cari", "it": "Cerca", "ja": "検索", "ko": "검색",
    "nb": "Søk", "nl": "Zoeken", "pl": "Szukaj", "pt-BR": "Buscar", "pt-PT": "Pesquisar",
    "ro": "Caută", "ru": "Поиск", "sv": "Sök", "th": "ค้นหา", "tr": "Ara",
    "uk": "Пошук", "vi": "Tìm", "zh-Hans": "搜索", "zh-Hant": "搜尋",
})
row("common.noMatches", {
    "ar": "لا توجد نتائج", "cs": "Žádné shody", "da": "Ingen resultater", "de": "Keine Treffer",
    "el": "Κανένα αποτέλεσμα", "es": "Sin coincidencias", "fi": "Ei osumia", "fr": "Aucun résultat",
    "he": "אין תוצאות", "hi": "कोई मेल नहीं", "hu": "Nincs találat", "id": "Tidak ada hasil",
    "it": "Nessun risultato", "ja": "一致するものがありません", "ko": "일치하는 항목 없음",
    "nb": "Ingen treff", "nl": "Geen overeenkomsten", "pl": "Brak wyników",
    "pt-BR": "Nenhuma correspondência", "pt-PT": "Sem resultados", "ro": "Nicio potrivire",
    "ru": "Нет совпадений", "sv": "Inga träffar", "th": "ไม่พบรายการ", "tr": "Eşleşme yok",
    "uk": "Немає збігів", "vi": "Không có kết quả", "zh-Hans": "没有匹配项", "zh-Hant": "沒有符合項目",
})
row("common.searchAria", {
    "ar": "بحث {label}", "cs": "Hledat {label}", "da": "Søg i {label}", "de": "{label} durchsuchen",
    "el": "Αναζήτηση {label}", "es": "Buscar {label}", "fi": "Hae: {label}", "fr": "Rechercher {label}",
    "he": "חיפוש {label}", "hi": "{label} खोजें", "hu": "{label} keresése", "id": "Cari {label}",
    "it": "Cerca {label}", "ja": "{label}を検索", "ko": "{label} 검색",
    "nb": "Søk i {label}", "nl": "{label} zoeken", "pl": "Szukaj: {label}",
    "pt-BR": "Buscar {label}", "pt-PT": "Pesquisar {label}", "ro": "Caută {label}",
    "ru": "Поиск: {label}", "sv": "Sök {label}", "th": "ค้นหา {label}", "tr": "{label} ara",
    "uk": "Пошук: {label}", "vi": "Tìm {label}", "zh-Hans": "搜索{label}", "zh-Hant": "搜尋{label}",
})
row("common.searchResults", {
    "ar": "نتائج بحث {label}", "cs": "Výsledky hledání: {label}", "da": "Søgeresultater for {label}",
    "de": "Suchergebnisse für {label}", "el": "Αποτελέσματα αναζήτησης {label}",
    "es": "Resultados de {label}", "fi": "Hakutulokset: {label}", "fr": "Résultats pour {label}",
    "he": "תוצאות חיפוש {label}", "hi": "{label} के परिणाम", "hu": "{label} találatai",
    "id": "Hasil pencarian {label}", "it": "Risultati per {label}", "ja": "{label}の検索結果",
    "ko": "{label} 검색 결과", "nb": "Søkeresultater for {label}", "nl": "Zoekresultaten voor {label}",
    "pl": "Wyniki dla {label}", "pt-BR": "Resultados de {label}", "pt-PT": "Resultados de {label}",
    "ro": "Rezultate pentru {label}", "ru": "Результаты: {label}", "sv": "Sökresultat för {label}",
    "th": "ผลการค้นหา {label}", "tr": "{label} arama sonuçları", "uk": "Результати: {label}",
    "vi": "Kết quả {label}", "zh-Hans": "{label}的搜索结果", "zh-Hant": "{label}的搜尋結果",
})

row("tools.stopwatch-timer.hours", {
    "ar": "ساعات", "cs": "Hodiny", "da": "Timer", "de": "Stunden", "el": "Ώρες",
    "es": "Horas", "fi": "Tunnit", "fr": "Heures", "he": "שעות", "hi": "घंटे",
    "hu": "Óra", "id": "Jam", "it": "Ore", "ja": "時間", "ko": "시간",
    "nb": "Timer", "nl": "Uren", "pl": "Godziny", "pt-BR": "Horas", "pt-PT": "Horas",
    "ro": "Ore", "ru": "Часы", "sv": "Timmar", "th": "ชั่วโมง", "tr": "Saat",
    "uk": "Години", "vi": "Giờ", "zh-Hans": "小时", "zh-Hant": "小時",
})

row("tools.pdf-organize.keepOne", {
    "ar": "أبقِ صفحة واحدة على الأقل.", "cs": "Ponechte alespoň jednu stránku.",
    "da": "Behold mindst én side.", "de": "Behalte mindestens eine Seite.",
    "el": "Κρατήστε τουλάχιστον μία σελίδα.", "es": "Conserva al menos una página.",
    "fi": "Säilytä vähintään yksi sivu.", "fr": "Gardez au moins une page.",
    "he": "יש להשאיר לפחות עמוד אחד.", "hi": "कम से कम एक पृष्ठ रखें।",
    "hu": "Tartson meg legalább egy oldalt.", "id": "Pertahankan setidaknya satu halaman.",
    "it": "Tieni almeno una pagina.", "ja": "少なくとも1ページは残してください。",
    "ko": "페이지를 하나 이상 남겨 주세요.", "nb": "Behold minst én side.",
    "nl": "Houd minstens één pagina.", "pl": "Zachowaj co najmniej jedną stronę.",
    "pt-BR": "Mantenha pelo menos uma página.", "pt-PT": "Mantenha pelo menos uma página.",
    "ro": "Păstrați cel puțin o pagină.", "ru": "Оставьте хотя бы одну страницу.",
    "sv": "Behåll minst en sida.", "th": "คงหน้าอย่างน้อยหนึ่งหน้า",
    "tr": "En az bir sayfa bırakın.", "uk": "Залиште принаймні одну сторінку.",
    "vi": "Giữ lại ít nhất một trang.", "zh-Hans": "请至少保留一页。", "zh-Hant": "請至少保留一頁。",
})

row("tools.pdf-redact.drawHint", {
    "ar": "اسحب على الصفحة لتغطية منطقة. أضف العدد الذي تحتاجه من المربعات ثم طبّق.",
    "cs": "Přetažením na stránce zakryjte oblast. Přidejte tolik rámečků, kolik potřebujete, a pak použijte.",
    "da": "Træk på siden for at dække et område. Tilføj så mange felter du har brug for, og anvend.",
    "de": "Ziehen Sie auf der Seite, um einen Bereich abzudecken. Fügen Sie so viele Kästen hinzu wie nötig, dann anwenden.",
    "el": "Σύρετε στη σελίδα για να καλύψετε μια περιοχή. Προσθέστε όσα πλαίσια χρειάζεστε και εφαρμόστε.",
    "es": "Arrastra sobre la página para cubrir una zona. Añade tantos recuadros como necesites y aplica.",
    "fi": "Vedä sivulla peittääksesi alueen. Lisää tarvittavat ruudut ja ota käyttöön.",
    "fr": "Faites glisser sur la page pour couvrir une zone. Ajoutez autant de cadres que nécessaire, puis appliquez.",
    "he": "גררו על העמוד כדי לכסות אזור. הוסיפו כמה ריבועים שצריך ואז החילו.",
    "hi": "किसी क्षेत्र को ढकने के लिए पृष्ठ पर खींचें। जितने बॉक्स चाहिए जोड़ें, फिर लागू करें।",
    "hu": "Húzással takarjon le egy területet. Adjon hozzá annyi dobozt, amennyi kell, majd alkalmazza.",
    "id": "Seret pada halaman untuk menutupi area. Tambahkan kotak sebanyak yang diperlukan, lalu terapkan.",
    "it": "Trascina sulla pagina per coprire un’area. Aggiungi tutti i riquadri necessari, poi applica.",
    "ja": "ページ上をドラッグして隠したい範囲を指定します。必要なだけ枠を追加してから適用してください。",
    "ko": "페이지를 드래그해 가릴 영역을 지정하세요. 필요한 만큼 상자를 추가한 뒤 적용합니다.",
    "nb": "Dra på siden for å dekke et område. Legg til så mange bokser du trenger, og bruk.",
    "nl": "Sleep over de pagina om een gebied te bedekken. Voeg zoveel kaders toe als nodig en pas toe.",
    "pl": "Przeciągnij na stronie, aby zakryć obszar. Dodaj tyle ramek, ile potrzeba, i zastosuj.",
    "pt-BR": "Arraste na página para cobrir uma área. Adicione quantas caixas precisar e aplique.",
    "pt-PT": "Arraste na página para cobrir uma área. Adicione as caixas necessárias e aplique.",
    "ro": "Trageți pe pagină pentru a acoperi o zonă. Adăugați câte casete aveți nevoie, apoi aplicați.",
    "ru": "Проведите по странице, чтобы закрыть область. Добавьте сколько нужно рамок и примените.",
    "sv": "Dra på sidan för att täcka ett område. Lägg till så många rutor du behöver och tillämpa.",
    "th": "ลากบนหน้าเพื่อปิดพื้นที่ เพิ่มกรอบได้ตามต้องการแล้วจึงนำไปใช้",
    "tr": "Bir alanı kapatmak için sayfada sürükleyin. Gerektiği kadar kutu ekleyip uygulayın.",
    "uk": "Проведіть по сторінці, щоб закрити ділянку. Додайте потрібну кількість рамок і застосуйте.",
    "vi": "Kéo trên trang để che một vùng. Thêm bao nhiêu khung cần thiết rồi áp dụng.",
    "zh-Hans": "在页面上拖动以遮盖区域。按需添加多个方框，然后应用。",
    "zh-Hant": "在頁面上拖曳以遮蓋區域。依需要新增多個方框，然後套用。",
})
row("tools.pdf-redact.undoBox", {
    "ar": "التراجع عن آخر مربع", "cs": "Vrátit poslední rámeček", "da": "Fortryd sidste felt",
    "de": "Letzten Kasten rückgängig", "el": "Αναίρεση τελευταίου πλαισίου", "es": "Deshacer último recuadro",
    "fi": "Kumoa viimeinen ruutu", "fr": "Annuler le dernier cadre", "he": "בטל ריבוע אחרון",
    "hi": "पिछला बॉक्स वापस लें", "hu": "Utolsó doboz visszavonása", "id": "Urungkan kotak terakhir",
    "it": "Annulla ultimo riquadro", "ja": "直前の枠を取り消す", "ko": "마지막 상자 실행 취소",
    "nb": "Angre siste boks", "nl": "Laatste kader ongedaan maken", "pl": "Cofnij ostatnią ramkę",
    "pt-BR": "Desfazer última caixa", "pt-PT": "Anular última caixa", "ro": "Anulează ultima casetă",
    "ru": "Отменить последнюю рамку", "sv": "Ångra senaste rutan", "th": "เลิกทำกรอบล่าสุด",
    "tr": "Son kutuyu geri al", "uk": "Скасувати останню рамку", "vi": "Hoàn tác khung vừa rồi",
    "zh-Hans": "撤销上一个方框", "zh-Hant": "復原上一個方框",
})
row("tools.pdf-redact.clearBoxes", {
    "ar": "مسح المربعات", "cs": "Vymazat rámečky", "da": "Ryd felter", "de": "Kästen leeren",
    "el": "Καθαρισμός πλαισίων", "es": "Borrar recuadros", "fi": "Tyhjennä ruudut",
    "fr": "Effacer les cadres", "he": "נקה ריבועים", "hi": "सभी बॉक्स साफ़ करें",
    "hu": "Dobozok törlése", "id": "Hapus kotak", "it": "Cancella riquadri",
    "ja": "枠をすべて消す", "ko": "상자 모두 지우기", "nb": "Tøm bokser", "nl": "Kaders wissen",
    "pl": "Wyczyść ramki", "pt-BR": "Limpar caixas", "pt-PT": "Limpar caixas",
    "ro": "Șterge casetele", "ru": "Очистить рамки", "sv": "Rensa rutor", "th": "ล้างกรอบ",
    "tr": "Kutuları temizle", "uk": "Очистити рамки", "vi": "Xóa các khung",
    "zh-Hans": "清除方框", "zh-Hant": "清除方框",
})

row("tools.images-to-pdf.fitA4", {
    "ar": "ملاءمة A4", "cs": "Přizpůsobit A4", "da": "Tilpas til A4", "de": "An A4 anpassen",
    "el": "Προσαρμογή σε A4", "es": "Ajustar a A4", "fi": "Sovita A4", "fr": "Ajuster au A4",
    "he": "התאם ל-A4", "hi": "A4 में फ़िट करें", "hu": "Igazítás A4-hez", "id": "Sesuaikan ke A4",
    "it": "Adatta ad A4", "ja": "A4に合わせる", "ko": "A4에 맞추기", "nb": "Tilpass til A4",
    "nl": "Passend op A4", "pl": "Dopasuj do A4", "pt-BR": "Ajustar ao A4", "pt-PT": "Ajustar a A4",
    "ro": "Potrivește pe A4", "ru": "Вписать в A4", "sv": "Anpassa till A4", "th": "พอดี A4",
    "tr": "A4’e sığdır", "uk": "Підігнати під A4", "vi": "Vừa khổ A4",
    "zh-Hans": "适合 A4", "zh-Hant": "符合 A4",
})
row("tools.images-to-pdf.fitImage", {
    "ar": "الحجم الأصلي", "cs": "Původní velikost", "da": "Oprindelig størrelse", "de": "Originalgröße",
    "el": "Αρχικό μέγεθος", "es": "Tamaño original", "fi": "Alkuperäinen koko", "fr": "Taille d’origine",
    "he": "גודל מקורי", "hi": "मूल आकार", "hu": "Eredeti méret", "id": "Ukuran asli",
    "it": "Dimensione originale", "ja": "元のサイズ", "ko": "원본 크기", "nb": "Opprinnelig størrelse",
    "nl": "Oorspronkelijke grootte", "pl": "Oryginalny rozmiar", "pt-BR": "Tamanho original",
    "pt-PT": "Tamanho original", "ro": "Dimensiune originală", "ru": "Исходный размер",
    "sv": "Originalstorlek", "th": "ขนาดต้นฉบับ", "tr": "Orijinal boyut", "uk": "Оригінальний розмір",
    "vi": "Kích thước gốc", "zh-Hans": "原始尺寸", "zh-Hant": "原始尺寸",
})

# Compress: force new meaning in every locale
row("tools.pdf-compress.name", {
    "ar": "تصغير كصور", "cs": "Zmenšit jako obrázky", "da": "Formindsk som billeder",
    "de": "Als Bilder verkleinern", "el": "Σμίκρυνση ως εικόνες", "es": "Reducir como imágenes",
    "fi": "Pienennä kuvina", "fr": "Réduire en images", "he": "כיווץ כתמונות",
    "hi": "छवियों के रूप में छोटा करें", "hu": "Kicsinyítés képként", "id": "Perkecil sebagai gambar",
    "it": "Riduci come immagini", "ja": "画像にして縮小", "ko": "이미지로 줄이기",
    "nb": "Krymp som bilder", "nl": "Verkleinen als afbeeldingen", "pl": "Zmniejsz jako obrazy",
    "pt-BR": "Reduzir como imagens", "pt-PT": "Reduzir como imagens", "ro": "Micșorează ca imagini",
    "ru": "Сжать как изображения", "sv": "Krymp som bilder", "th": "ย่อเป็นรูปภาพ",
    "tr": "Görüntü olarak küçült", "uk": "Зменшити як зображення", "vi": "Thu nhỏ thành ảnh",
    "zh-Hans": "转为图像并缩小", "zh-Hant": "轉為圖像並縮小",
})
row("tools.pdf-compress.description", {
    "ar": "حوّل كل صفحة إلى JPEG. لا يُحتفظ بالنص أو الروابط أو الرسوم المتجهية.",
    "cs": "Rasterizuje každou stránku do JPEG. Text, odkazy a vektory se neuchovají.",
    "da": "Rasteriserer hver side til JPEG. Tekst, links og vektorer bevares ikke.",
    "de": "Rastert jede Seite als JPEG. Text, Links und Vektoren bleiben nicht erhalten.",
    "el": "Μετατρέπει κάθε σελίδα σε JPEG. Το κείμενο, οι σύνδεσμοι και τα διανύσματα δεν διατηρούνται.",
    "es": "Rasteriza cada página a JPEG. No se conservan texto, enlaces ni vectores.",
    "fi": "Rasteroi jokaisen sivun JPEG-kuvaksi. Teksti, linkit ja vektorit eivät säily.",
    "fr": "Rasterise chaque page en JPEG. Le texte, les liens et les vecteurs ne sont pas conservés.",
    "he": "מרסתר כל עמוד ל-JPEG. טקסט, קישורים ווקטור לא נשמרים.",
    "hi": "हर पृष्ठ को JPEG में बदलता है। पाठ, लिंक और वेक्टर नहीं रहते।",
    "hu": "Minden oldalt JPEG-képpé raszterizál. A szöveg, a hivatkozások és a vektorok nem maradnak meg.",
    "id": "Meraster setiap halaman menjadi JPEG. Teks, tautan, dan vektor tidak dipertahankan.",
    "it": "Rasterizza ogni pagina in JPEG. Testo, link e vettori non vengono conservati.",
    "ja": "各ページをJPEG画像にします。テキスト、リンク、ベクターは残りません。",
    "ko": "각 페이지를 JPEG로 래스터화합니다. 텍스트, 링크, 벡터는 유지되지 않습니다.",
    "nb": "Rasteriserer hver side til JPEG. Tekst, lenker og vektorer beholdes ikke.",
    "nl": "Rastert elke pagina naar JPEG. Tekst, links en vectoren blijven niet bewaard.",
    "pl": "Rasteryzuje każdą stronę do JPEG. Tekst, łącza i wektory nie są zachowywane.",
    "pt-BR": "Rasteriza cada página em JPEG. Texto, links e vetores não são mantidos.",
    "pt-PT": "Rasteriza cada página em JPEG. Texto, ligações e vetores não são mantidos.",
    "ro": "Rasterizează fiecare pagină în JPEG. Textul, linkurile și vectorii nu se păstrează.",
    "ru": "Растрирует каждую страницу в JPEG. Текст, ссылки и векторы не сохраняются.",
    "sv": "Rastrerar varje sida till JPEG. Text, länkar och vektorer behålls inte.",
    "th": "แปลงแต่ละหน้าเป็น JPEG จะไม่คงข้อความ ลิงก์ หรือเวกเตอร์",
    "tr": "Her sayfayı JPEG olarak tarar. Metin, bağlantılar ve vektörler korunmaz.",
    "uk": "Раструє кожну сторінку в JPEG. Текст, посилання й вектори не зберігаються.",
    "vi": "Raster từng trang thành JPEG. Văn bản, liên kết và vector không được giữ.",
    "zh-Hans": "将每一页栅格化为 JPEG。文本、链接和矢量不会保留。",
    "zh-Hant": "將每一頁柵格化為 JPEG。文字、連結與向量不會保留。",
})
row("tools.pdf-compress.note", {
    "ar": "تُحوَّل كل صفحة إلى صورة JPEG ثم تُبنى كملف PDF جديد. يختفي النص القابل للبحث والروابط والرسوم المتجهية. قد يكبر الملف. مناسب للمسح الضوئي لا للمستندات التي تحتاج البحث.",
    "cs": "Každá stránka se změní na obrázek JPEG a složí do nového PDF. Prohledávatelný text, odkazy a vektory zmizí. Soubor může narůst. Hodí se na skeny, ne na smlouvy k vyhledávání.",
    "da": "Hver side bliver et JPEG-billede og bygges som et nyt PDF. Søgbar tekst, links og vektorer fjernes. Filen kan blive større. Brug det til fotoskanninger, ikke dokumenter du skal søge i.",
    "de": "Jede Seite wird ein JPEG-Bild und als neues PDF neu aufgebaut. Durchsuchbarer Text, Links und Vektoren entfallen. Die Datei kann größer werden. Für Foto-Scans, nicht für Verträge zum Durchsuchen.",
    "el": "Κάθε σελίδα γίνεται εικόνα JPEG και ξαναχτίζεται ως νέο PDF. Το αναζητήσιμο κείμενο, οι σύνδεσμοι και τα διανύσματα χάνονται. Το αρχείο μπορεί να μεγαλώσει. Για σαρώσεις φωτογραφιών, όχι για συμβόλαια.",
    "es": "Cada página se convierte en una imagen JPEG y se reconstruye un PDF nuevo. Desaparecen el texto buscable, los enlaces y los vectores. El archivo puede crecer. Úsalo en escaneos, no en contratos que debas buscar.",
    "fi": "Jokainen sivu muuttuu JPEG-kuvaksi ja kootaan uudeksi PDF:ksi. Haettava teksti, linkit ja vektorit katoavat. Tiedosto voi kasvaa. Sopii valokuvaskannauksiin, ei sopimuksiin.",
    "fr": "Chaque page devient une image JPEG, puis un nouveau PDF. Le texte interrogeable, les liens et les vecteurs disparaissent. Le fichier peut grossir. Pour les scans photo, pas pour les contrats à rechercher.",
    "he": "כל עמוד הופך לתמונת JPEG ונבנה מחדש כ־PDF. טקסט לחיפוש, קישורים ווקטור נעלמים. הקובץ עלול לגדול. מתאים לסריקות תמונה, לא למסמכים לחיפוש.",
    "hi": "हर पृष्ठ JPEG चित्र बनकर नई PDF में जुड़ता है। खोजने योग्य पाठ, लिंक और वेक्टर हट जाते हैं। फ़ाइल बड़ी हो सकती है। फ़ोटो स्कैन के लिए, खोजने योग्य अनुबंधों के लिए नहीं।",
    "hu": "Minden oldal JPEG-kép lesz, majd új PDF készül. A kereshető szöveg, a hivatkozások és a vektorok eltűnnek. A fájl nőhet. Fénykép-szkenneléshez való, nem kereshető szerződésekhez.",
    "id": "Setiap halaman menjadi gambar JPEG lalu disusun PDF baru. Teks yang bisa dicari, tautan, dan vektor hilang. Berkas bisa membesar. Cocok untuk pindaian foto, bukan kontrak yang perlu dicari.",
    "it": "Ogni pagina diventa un’immagine JPEG e un nuovo PDF. Testo ricercabile, link e vettori spariscono. Il file può ingrandirsi. Per scansioni fotografiche, non per contratti da cercare.",
    "ja": "各ページをJPEG画像にして新しいPDFを組み立てます。検索できる文字、リンク、ベクターは消えます。ファイルが大きくなることもあります。契約書の検索用途ではなく、写真スキャン向けです。",
    "ko": "각 페이지가 JPEG 이미지가 되어 새 PDF로 다시 만들어집니다. 검색 가능한 텍스트, 링크, 벡터는 사라집니다. 파일이 커질 수 있습니다. 문서를 검색해야 할 때가 아니라 사진 스캔에 맞습니다.",
    "nb": "Hver side blir et JPEG-bilde og settes sammen til en ny PDF. Søkbar tekst, lenker og vektorer forsvinner. Filen kan bli større. For bildeskann, ikke kontrakter du skal søke i.",
    "nl": "Elke pagina wordt een JPEG-afbeelding en een nieuwe PDF. Doorzoekbare tekst, links en vectoren verdwijnen. Het bestand kan groter worden. Voor fotoscans, niet voor contracten om in te zoeken.",
    "pl": "Każda strona staje się obrazem JPEG i nowym PDF. Znika tekst do wyszukiwania, łącza i wektory. Plik może urosnąć. Do skanów zdjęć, nie do umów, w których trzeba szukać.",
    "pt-BR": "Cada página vira uma imagem JPEG e um PDF novo. Texto pesquisável, links e vetores somem. O arquivo pode crescer. Para digitalizações de fotos, não para contratos a pesquisar.",
    "pt-PT": "Cada página torna-se uma imagem JPEG e um PDF novo. O texto pesquisável, as ligações e os vetores desaparecem. O ficheiro pode crescer. Para digitalizações fotográficas, não para contratos a pesquisar.",
    "ro": "Fiecare pagină devine o imagine JPEG, apoi un PDF nou. Textul căutabil, linkurile și vectorii dispar. Fișierul poate crește. Pentru scanări foto, nu pentru contracte de căutat.",
    "ru": "Каждая страница становится JPEG и собирается в новый PDF. Исчезают искомый текст, ссылки и векторы. Файл может стать больше. Для фотосканов, не для договоров, по которым нужно искать.",
    "sv": "Varje sida blir en JPEG-bild och ett nytt PDF. Sökbar text, länkar och vektorer försvinner. Filen kan bli större. För bildskanningar, inte avtal du behöver söka i.",
    "th": "แต่ละหน้ากลายเป็นภาพ JPEG แล้วประกอบเป็น PDF ใหม่ ข้อความที่ค้นได้ ลิงก์ และเวกเตอร์จะหาย ไฟล์อาจใหญ่ขึ้น เหมาะกับสแกนรูป ไม่ใช่สัญญาที่ต้องค้น",
    "tr": "Her sayfa JPEG görüntüye dönüşüp yeni bir PDF olur. Aranabilir metin, bağlantılar ve vektörler gider. Dosya büyüyebilir. Fotoğraf taramaları için; aranacak sözleşmeler için değil.",
    "uk": "Кожна сторінка стає JPEG і новим PDF. Зникають текст для пошуку, посилання й вектори. Файл може зрости. Для фотосканів, не для договорів, у яких треба шукати.",
    "vi": "Mỗi trang thành ảnh JPEG rồi ghép PDF mới. Chữ tìm được, liên kết và vector biến mất. Tệp có thể lớn hơn. Dùng cho bản scan ảnh, không phải hợp đồng cần tìm.",
    "zh-Hans": "每一页都会变成 JPEG 图片再组成新的 PDF。可搜索的文字、链接和矢量会消失。文件可能会变大。适合照片扫描，不适合还需要检索的合同。",
    "zh-Hant": "每一頁都會變成 JPEG 圖片再組成新的 PDF。可搜尋的文字、連結與向量會消失。檔案可能變大。適合照片掃描，不適合仍需檢索的合約。",
})
row("tools.pdf-compress.run", {
    "ar": "تصغير", "cs": "Zmenšit", "da": "Formindsk", "de": "Verkleinern", "el": "Σμίκρυνση",
    "es": "Reducir", "fi": "Pienennä", "fr": "Réduire", "he": "כווץ", "hi": "छोटा करें",
    "hu": "Kicsinyítés", "id": "Perkecil", "it": "Riduci", "ja": "縮小する", "ko": "줄이기",
    "nb": "Krymp", "nl": "Verkleinen", "pl": "Zmniejsz", "pt-BR": "Reduzir", "pt-PT": "Reduzir",
    "ro": "Micșorează", "ru": "Сжать", "sv": "Krymp", "th": "ย่อ", "tr": "Küçült",
    "uk": "Зменшити", "vi": "Thu nhỏ", "zh-Hans": "缩小", "zh-Hant": "縮小",
})
row("tools.pdf-compress.success", {
    "ar": "ملف PDF المصغّر جاهز للتنزيل.", "cs": "Zmenšené PDF je připraveno ke stažení.",
    "da": "Den formindskede PDF er klar til download.", "de": "Das verkleinerte PDF steht zum Download bereit.",
    "el": "Το μικρότερο PDF είναι έτοιμο για λήψη.", "es": "El PDF reducido está listo para descargar.",
    "fi": "Pienennetty PDF on valmis ladattavaksi.", "fr": "Le PDF réduit est prêt à être téléchargé.",
    "he": "קובץ ה-PDF המכווץ מוכן להורדה.", "hi": "छोटी PDF डाउनलोड के लिए तैयार है।",
    "hu": "A kicsinyített PDF letölthető.", "id": "PDF yang diperkecil siap diunduh.",
    "it": "Il PDF ridotto è pronto per il download.", "ja": "縮小したPDFをダウンロードできます。",
    "ko": "줄어든 PDF를 다운로드할 수 있습니다.", "nb": "Den krympede PDF-en er klar til nedlasting.",
    "nl": "De verkleinde PDF is klaar om te downloaden.", "pl": "Zmniejszony PDF jest gotowy do pobrania.",
    "pt-BR": "O PDF reduzido está pronto para baixar.", "pt-PT": "O PDF reduzido está pronto para transferir.",
    "ro": "PDF-ul micșorat este gata de descărcat.", "ru": "Уменьшённый PDF готов к скачиванию.",
    "sv": "Den krympta PDF:en är klar att ladda ner.", "th": "PDF ที่ย่อแล้วพร้อมดาวน์โหลด",
    "tr": "Küçültülmüş PDF indirilmeye hazır.", "uk": "Зменшений PDF готовий до завантаження.",
    "vi": "PDF đã thu nhỏ sẵn sàng tải xuống.", "zh-Hans": "缩小后的 PDF 可以下载了。", "zh-Hant": "縮小後的 PDF 可以下載了。",
})

OCCASION = {
    "saferInternetDay": {
        "ar": "يوم الإنترنت الأكثر أمانًا", "cs": "Den bezpečnějšího internetu", "da": "Sikrere internet-dag",
        "de": "Tag des sicheren Internets", "el": "Ημέρα ασφαλέστερου διαδικτύου", "es": "Día de Internet Segura",
        "fi": "Turvallisemman internetin päivä", "fr": "Journée pour un internet plus sûr",
        "he": "יום האינטרנט הבטוח יותר", "hi": "सुरक्षित इंटरनेट दिवस", "hu": "Biztonságosabb internet napja",
        "id": "Hari Internet Lebih Aman", "it": "Giornata per un internet più sicuro",
        "ja": "より安全なインターネットの日", "ko": "더 안전한 인터넷의 날", "nb": "Tryggere internett-dagen",
        "nl": "Dag van het veiliger internet", "pl": "Dzień Bezpieczniejszego Internetu",
        "pt-BR": "Dia da Internet Mais Segura", "pt-PT": "Dia da Internet Mais Segura",
        "ro": "Ziua internetului mai sigur", "ru": "День безопасного интернета", "sv": "Säkrare internet-dagen",
        "th": "วันอินเทอร์เน็ตที่ปลอดภัยขึ้น", "tr": "Daha Güvenli İnternet Günü",
        "uk": "День безпечнішого інтернету", "vi": "Ngày Internet an toàn hơn",
        "zh-Hans": "更安全的互联网日", "zh-Hant": "更安全的網際網路日",
    },
    "womenAndGirlsInScience": {
        "ar": "اليوم الدولي للمرأة والفتاة في ميدان العلوم", "cs": "Mezinárodní den žen a dívek ve vědě",
        "da": "International dag for kvinder og piger i videnskab", "de": "Internationaler Tag der Frauen und Mädchen in der Wissenschaft",
        "el": "Διεθνής ημέρα γυναικών και κοριτσιών στην επιστήμη",
        "es": "Día Internacional de la Mujer y la Niña en la Ciencia",
        "fi": "Naisten ja tyttöjen tiedepäivä", "fr": "Journée internationale des femmes et des filles de science",
        "he": "היום הבינלאומי לנשים ולנערות במדע", "hi": "विज्ञान में महिला और बालिका अंतरराष्ट्रीय दिवस",
        "hu": "A nők és lányok tudományban eltöltött nemzetközi napja",
        "id": "Hari Perempuan dan Anak Perempuan dalam Sains", "it": "Giornata internazionale delle donne e delle ragazze nella scienza",
        "ja": "女性と少女の科学国際デー", "ko": "여성과 소녀 과학 국제의 날",
        "nb": "Internasjonal dag for kvinner og jenter i vitenskap", "nl": "Internationale dag van vrouwen en meisjes in de wetenschap",
        "pl": "Międzynarodowy Dzień Kobiet i Dziewcząt w Nauce",
        "pt-BR": "Dia Internacional de Mulheres e Meninas na Ciência",
        "pt-PT": "Dia Internacional das Mulheres e Raparigas na Ciência",
        "ro": "Ziua internațională a femeilor și fetelor în știință",
        "ru": "Международный день женщин и девочек в науке", "sv": "Internationella dagen för kvinnor och flickor i vetenskap",
        "th": "วันสตรีและเด็กหญิงในวิทยาศาสตร์สากล", "tr": "Bilimde Kadın ve Kız Çocukları Uluslararası Günü",
        "uk": "Міжнародний день жінок і дівчат у науці", "vi": "Ngày quốc tế phụ nữ và trẻ em gái trong khoa học",
        "zh-Hans": "女童和妇女科学国际日", "zh-Hant": "女童和婦女科學國際日",
    },
    "piDay": {
        "ar": "يوم باي", "cs": "Den pí", "da": "Pi-dag", "de": "Pi-Tag", "el": "Ημέρα του π",
        "es": "Día de Pi", "fi": "Piin päivä", "fr": "Journée de pi", "he": "יום פאי", "hi": "पाई दिवस",
        "hu": "Pi-nap", "id": "Hari Pi", "it": "Giorno del pi greco", "ja": "円周率の日", "ko": "파이의 날",
        "nb": "Pi-dagen", "nl": "Pi-dag", "pl": "Dzień liczby π", "pt-BR": "Dia do Pi", "pt-PT": "Dia do Pi",
        "ro": "Ziua lui pi", "ru": "День числа пи", "sv": "Pi-dagen", "th": "วันพาย", "tr": "Pi Günü",
        "uk": "День числа пі", "vi": "Ngày số Pi", "zh-Hans": "圆周率日", "zh-Hant": "圓周率日",
    },
    "backupDay": {
        "ar": "اليوم العالمي للنسخ الاحتياطي", "cs": "Světový den záloh", "da": "Verdens backup-dag",
        "de": "Welt-Backup-Tag", "el": "Παγκόσμια ημέρα αντιγράφων ασφαλείας",
        "es": "Día Mundial de las Copias de Seguridad", "fi": "Maailman varmuuskopiopäivä",
        "fr": "Journée mondiale de la sauvegarde", "he": "היום העולמי לגיבוי", "hi": "विश्व बैकअप दिवस",
        "hu": "A biztonsági mentés világnapja", "id": "Hari Cadangan Dunia", "it": "Giornata mondiale del backup",
        "ja": "世界バックアップデー", "ko": "세계 백업의 날", "nb": "Verdens backup-dag",
        "nl": "Wereldback-updag", "pl": "Światowy Dzień Kopii Zapasowej",
        "pt-BR": "Dia Mundial do Backup", "pt-PT": "Dia Mundial da Cópia de Segurança",
        "ro": "Ziua mondială a copiei de rezervă", "ru": "Всемирный день резервного копирования",
        "sv": "Världsbackupdagen", "th": "วันสำรองข้อมูลโลก", "tr": "Dünya Yedekleme Günü",
        "uk": "Всесвітній день резервного копіювання", "vi": "Ngày sao lưu thế giới",
        "zh-Hans": "世界备份日", "zh-Hant": "世界備份日",
    },
    "earthDay": {
        "ar": "يوم الأرض", "cs": "Den Země", "da": "Jordens dag", "de": "Tag der Erde", "el": "Ημέρα της Γης",
        "es": "Día de la Tierra", "fi": "Maan päivä", "fr": "Jour de la Terre", "he": "יום כדור הארץ",
        "hi": "पृथ्वी दिवस", "hu": "A Föld napja", "id": "Hari Bumi", "it": "Giornata della Terra",
        "ja": "地球の日", "ko": "지구의 날", "nb": "Jordens dag", "nl": "Dag van de Aarde",
        "pl": "Dzień Ziemi", "pt-BR": "Dia da Terra", "pt-PT": "Dia da Terra", "ro": "Ziua Pământului",
        "ru": "День Земли", "sv": "Jordens dag", "th": "วันโลก", "tr": "Dünya Günü",
        "uk": "День Землі", "vi": "Ngày Trái Đất", "zh-Hans": "世界地球日", "zh-Hant": "世界地球日",
    },
    "passwordDay": {
        "ar": "اليوم العالمي لكلمة المرور", "cs": "Světový den hesel", "da": "Verdens adgangskode-dag",
        "de": "Welt-Passwort-Tag", "el": "Παγκόσμια ημέρα κωδικού", "es": "Día Mundial de la Contraseña",
        "fi": "Maailman salasanapäivä", "fr": "Journée mondiale du mot de passe", "he": "היום העולמי לסיסמה",
        "hi": "विश्व पासवर्ड दिवस", "hu": "A jelszó világnapja", "id": "Hari Kata Sandi Dunia",
        "it": "Giornata mondiale della password", "ja": "世界パスワードデー", "ko": "세계 암호의 날",
        "nb": "Verdens passorddag", "nl": "Wereldwachtwoorddag", "pl": "Światowy Dzień Hasła",
        "pt-BR": "Dia Mundial da Senha", "pt-PT": "Dia Mundial da Palavra-passe",
        "ro": "Ziua mondială a parolei", "ru": "Всемирный день пароля", "sv": "Världslösensdagen",
        "th": "วันรหัสผ่านโลก", "tr": "Dünya Parola Günü", "uk": "Всесвітній день пароля",
        "vi": "Ngày mật khẩu thế giới", "zh-Hans": "世界密码日", "zh-Hant": "世界密碼日",
    },
    "webDay": {
        "ar": "يوم الشبكة العالمية", "cs": "Den World Wide Webu", "da": "World Wide Web-dagen",
        "de": "Tag des World Wide Web", "el": "Ημέρα του Παγκόσμιου Ιστού", "es": "Día Mundial de la Web",
        "fi": "World Wide Webin päivä", "fr": "Journée du World Wide Web", "he": "יום הרשת העולמית",
        "hi": "वर्ल्ड वाइड वेब दिवस", "hu": "A Világháló napja", "id": "Hari World Wide Web",
        "it": "Giornata del World Wide Web", "ja": "ワールドワイドウェブの日", "ko": "월드 와이드 웹의 날",
        "nb": "World Wide Web-dagen", "nl": "Dag van het World Wide Web", "pl": "Dzień World Wide Web",
        "pt-BR": "Dia da World Wide Web", "pt-PT": "Dia da World Wide Web", "ro": "Ziua World Wide Web",
        "ru": "День Всемирной паутины", "sv": "World Wide Web-dagen", "th": "วันเวิลด์ไวด์เว็บ",
        "tr": "World Wide Web Günü", "uk": "День Всесвітньої павутини", "vi": "Ngày World Wide Web",
        "zh-Hans": "万维网日", "zh-Hant": "全球資訊網日",
    },
    "adaLovelaceDay": {
        "ar": "يوم آدا لوفلايس", "cs": "Den Ady Lovelace", "da": "Ada Lovelace-dagen",
        "de": "Ada-Lovelace-Tag", "el": "Ημέρα της Ada Lovelace", "es": "Día de Ada Lovelace",
        "fi": "Ada Lovelacen päivä", "fr": "Journée Ada Lovelace", "he": "יום עדה לאבלייס",
        "hi": "एडा लवलेस दिवस", "hu": "Ada Lovelace napja", "id": "Hari Ada Lovelace",
        "it": "Giornata di Ada Lovelace", "ja": "エイダ・ラブレスの日", "ko": "에이다 러브레이스의 날",
        "nb": "Ada Lovelace-dagen", "nl": "Ada Lovelace-dag", "pl": "Dzień Ady Lovelace",
        "pt-BR": "Dia de Ada Lovelace", "pt-PT": "Dia de Ada Lovelace", "ro": "Ziua Ada Lovelace",
        "ru": "День Ады Лавлейс", "sv": "Ada Lovelace-dagen", "th": "วันเอดา เลิฟเลซ",
        "tr": "Ada Lovelace Günü", "uk": "День Ади Лавлейс", "vi": "Ngày Ada Lovelace",
        "zh-Hans": "埃达·洛夫莱斯日", "zh-Hant": "愛達·勒芙蕾絲日",
    },
    "computerSecurityDay": {
        "ar": "يوم أمن الحاسوب", "cs": "Den počítačové bezpečnosti", "da": "Computer-sikkerhedsdag",
        "de": "Tag der Computersicherheit", "el": "Ημέρα ασφάλειας υπολογιστών",
        "es": "Día de la Seguridad Informática", "fi": "Tietoturvapäivä",
        "fr": "Journée de la sécurité informatique", "he": "יום אבטחת המחשבים",
        "hi": "कंप्यूटर सुरक्षा दिवस", "hu": "A számítógép-biztonság napja", "id": "Hari Keamanan Komputer",
        "it": "Giornata della sicurezza informatica", "ja": "コンピュータセキュリティの日",
        "ko": "컴퓨터 보안의 날", "nb": "Datasikkerhetsdagen", "nl": "Dag van de computerbeveiliging",
        "pl": "Dzień Bezpieczeństwa Komputerowego", "pt-BR": "Dia da Segurança da Computação",
        "pt-PT": "Dia da Segurança Informática", "ro": "Ziua securității informatice",
        "ru": "День компьютерной безопасности", "sv": "Datasäkerhetsdagen", "th": "วันความปลอดภัยคอมพิวเตอร์",
        "tr": "Bilgisayar Güvenliği Günü", "uk": "День комп’ютерної безпеки", "vi": "Ngày an ninh máy tính",
        "zh-Hans": "计算机安全日", "zh-Hant": "電腦安全日",
    },
    "programmersDay": {
        "ar": "يوم المبرمجين", "cs": "Den programátorů", "da": "Programmørernes dag",
        "de": "Tag der Programmiererinnen und Programmierer", "el": "Ημέρα προγραμματιστών",
        "es": "Día de los Programadores", "fi": "Ohjelmoijien päivä", "fr": "Journée des programmeurs",
        "he": "יום המתכנתים", "hi": "प्रोग्रामर दिवस", "hu": "A programozók napja",
        "id": "Hari Pemrogram", "it": "Giornata dei programmatori", "ja": "プログラマーの日",
        "ko": "프로그래머의 날", "nb": "Programmerernes dag", "nl": "Dag van de programmeurs",
        "pl": "Dzień Programistów", "pt-BR": "Dia dos Programadores", "pt-PT": "Dia dos Programadores",
        "ro": "Ziua programatorilor", "ru": "День программиста", "sv": "Programmerarnas dag",
        "th": "วันโปรแกรมเมอร์", "tr": "Programcılar Günü", "uk": "День програміста",
        "vi": "Ngày lập trình viên", "zh-Hans": "程序员节", "zh-Hant": "程式設計師節",
    },
}

for key, mapping in OCCASION.items():
    row(f"home.greeting.occasionLabel.{key}", mapping)

for loc, mapping in GREETING_LATER.items():
    for key, value in mapping.items():
        path = "home.subtitleFacts.fact5" if key == "fact5" else f"home.greeting.{key}"
        T.setdefault(loc, {})[path] = value

for loc, mapping in DATE_CALC.items():
    for key, value in mapping.items():
        T.setdefault(loc, {})[f"tools.date-calculator.{key}"] = value

FORCE = {
    "tools.pdf-compress.name",
    "tools.pdf-compress.description",
    "tools.pdf-compress.note",
    "tools.pdf-compress.run",
    "tools.pdf-compress.success",
}

def extras_of(data: dict) -> set[str]:
    values = {
        deep_get(data, "home.greeting.extra1"),
        deep_get(data, "home.greeting.extra2"),
        deep_get(data, "home.greeting.extra3"),
    }
    return {value for value in values if isinstance(value, str) and value}

def should_write(path: str, current, value: str, english_val, extras: set[str]) -> bool:
    if current == value:
        return False
    if path in FORCE:
        return True
    if current in (None, "") or current == english_val:
        return True
    if path in GREETING_DISTINCT_PATHS and current in extras:
        return True
    return False

def localize_embedded_occasion_names(data: dict, english: dict) -> int:
    en_labels = deep_get(english, "home.greeting.occasionLabel") or {}
    loc_labels = deep_get(data, "home.greeting.occasionLabel") or {}
    if not isinstance(en_labels, dict) or not isinstance(loc_labels, dict):
        return 0
    n = 0
    for key, en_label in sorted(en_labels.items(), key=lambda item: -len(str(item[1]))):
        loc_label = loc_labels.get(key)
        if not isinstance(en_label, str) or not isinstance(loc_label, str) or loc_label == en_label:
            continue
        for section_path in (f"home.greeting.observance.{key}", f"home.subtitleObservance.{key}"):
            current = deep_get(data, section_path)
            if isinstance(current, str) and en_label in current:
                deep_set(data, section_path, current.replace(en_label, loc_label))
                n += 1
    return n

def apply_locale(loc: str, data: dict, english: dict) -> int:
    n = 0
    extras = extras_of(data)
    for path, value in T.get(loc, {}).items():
        current = deep_get(data, path)
        english_val = deep_get(english, path)
        if should_write(path, current, value, english_val, extras):
            deep_set(data, path, value)
            n += 1
    n += localize_embedded_occasion_names(data, english)
    return n

def main() -> None:
    english = json.loads((MESSAGES / "en.json").read_text())
    total = 0
    for loc in LOCALES:
        path = MESSAGES / f"{loc}.json"
        data = json.loads(path.read_text())
        changed = apply_locale(loc, data, english)
        if changed:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
            total += changed
            print(f"{loc}: {changed} strings")
    zh_hans = json.loads((MESSAGES / "zh-Hans.json").read_text())
    (MESSAGES / "zh.json").write_text(json.dumps(zh_hans, ensure_ascii=False, indent=2) + "\n")
    print(f"updated {total} strings; synced zh.json from zh-Hans")

if __name__ == "__main__":
    main()
