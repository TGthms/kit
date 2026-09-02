#!/usr/bin/env python3
"""Align converter chrome, prune currency clones, and fill leftover English unit labels."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MESSAGES = ROOT / "messages"

CURRENCY_KEEP = {
    "name",
    "description",
    "keywords",
    "currency",
    "limits",
    "from",
    "to",
    "result",
    "saved",
    "record",
    "loadingRate",
    "rate",
    "stale",
    "asOf",
    "usingCache",
    "updated",
    "refresh",
    "search",
    "swapCurrencies",
    "rateUnavailable",
    "searchAria",
}

# Distinctive units (not identical to English in Germanic languages).
UNITS: dict[str, dict[str, str]] = {
    "ar": {
        "unitMm": "ملليمتر (mm)",
        "unitCm": "سنتيمتر (cm)",
        "unitM": "متر (m)",
        "unitKm": "كيلومتر (km)",
        "unitIn": "بوصة (in)",
        "unitFt": "قدم (ft)",
        "unitYd": "ياردة (yd)",
        "unitMi": "ميل (mi)",
        "unitNmi": "ميل بحري (nmi)",
        "unitStone": "ستون",
        "unitUsTsp": "ملعقة شاي أمريكية",
        "unitUsTbsp": "ملعقة طعام أمريكية",
        "unitUsCup": "كوب أمريكي",
        "unitUsGal": "غالون أمريكي",
        "unitImpGal": "غالون إمبراطوري",
        "unitKnot": "عقدة",
        "unitHp": "حصان ميكانيكي",
        "swapUnits": "تبديل الوحدات",
        "swapCurrencies": "تبديل العملات",
        "search": "بحث",
        "searchAria": "بحث {label}",
        "typographyReferences": "مراجع الطباعة",
        "typographyHint": "اضبط مرجع الجذر أو الأب أو الشاشة لـ rem و em و pt.",
        "rootFontSize": "حجم خط الجذر",
        "parentFontSize": "حجم خط الأب",
        "dpi": "DPI",
        "rateUnavailable": "خدمة الأسعار غير متاحة",
    },
    "ja": {
        "unitMm": "ミリメートル (mm)",
        "unitCm": "センチメートル (cm)",
        "unitM": "メートル (m)",
        "unitKm": "キロメートル (km)",
        "unitIn": "インチ (in)",
        "unitFt": "フィート (ft)",
        "unitYd": "ヤード (yd)",
        "unitMi": "マイル (mi)",
        "unitNmi": "海里 (nmi)",
        "unitStone": "ストーン",
        "unitUsTsp": "米ティースプーン",
        "unitUsTbsp": "米テーブルスプーン",
        "unitUsCup": "米カップ",
        "unitUsGal": "米ガロン",
        "unitImpGal": "英ガロン",
        "unitKnot": "ノット",
        "unitHp": "機械馬力",
        "swapUnits": "単位を入れ替え",
        "swapCurrencies": "通貨を入れ替え",
        "typographyReferences": "タイポグラフィの基準",
        "typographyHint": "rem、em、ptで使うルート、親、画面の基準値を設定します。",
        "rootFontSize": "ルートのフォントサイズ",
        "parentFontSize": "親のフォントサイズ",
        "dpi": "DPI",
        "rateUnavailable": "為替レートサービスを利用できません",
        "searchAria": "{label}を検索",
    },
    "ko": {
        "unitMm": "밀리미터 (mm)",
        "unitCm": "센티미터 (cm)",
        "unitM": "미터 (m)",
        "unitKm": "킬로미터 (km)",
        "unitIn": "인치 (in)",
        "unitFt": "피트 (ft)",
        "unitYd": "야드 (yd)",
        "unitMi": "마일 (mi)",
        "unitNmi": "해리 (nmi)",
        "unitStone": "스톤",
        "unitUsTsp": "미국 티스푼",
        "unitUsTbsp": "미국 테이블스푼",
        "unitUsCup": "미국 컵",
        "unitUsGal": "미국 갤런",
        "unitImpGal": "영국 갤런",
        "unitKnot": "노트",
        "unitHp": "기계 마력",
        "swapUnits": "단위 바꾸기",
        "swapCurrencies": "통화 바꾸기",
        "typographyReferences": "타이포그래피 기준",
        "typographyHint": "rem, em, pt에 사용할 루트·상위·화면 기준을 설정합니다.",
        "rootFontSize": "루트 글꼴 크기",
        "parentFontSize": "상위 글꼴 크기",
        "dpi": "DPI",
        "rateUnavailable": "환율 서비스를 사용할 수 없습니다",
        "searchAria": "{label} 검색",
    },
    "zh-Hans": {
        "unitMm": "毫米 (mm)",
        "unitCm": "厘米 (cm)",
        "unitM": "米 (m)",
        "unitKm": "千米 (km)",
        "unitIn": "英寸 (in)",
        "unitFt": "英尺 (ft)",
        "unitYd": "码 (yd)",
        "unitMi": "英里 (mi)",
        "unitNmi": "海里 (nmi)",
        "unitStone": "英石",
        "unitUsTsp": "美制茶匙",
        "unitUsTbsp": "美制汤匙",
        "unitUsCup": "美制杯",
        "unitUsGal": "美制加仑",
        "unitImpGal": "英制加仑",
        "unitKnot": "节",
        "unitHp": "机械马力",
    },
    "zh-Hant": {
        "unitMm": "毫米 (mm)",
        "unitCm": "公分 (cm)",
        "unitM": "公尺 (m)",
        "unitKm": "公里 (km)",
        "unitIn": "英吋 (in)",
        "unitFt": "英尺 (ft)",
        "unitYd": "碼 (yd)",
        "unitMi": "英里 (mi)",
        "unitNmi": "海里 (nmi)",
        "unitStone": "英石",
        "unitUsTsp": "美制茶匙",
        "unitUsTbsp": "美制湯匙",
        "unitUsCup": "美制杯",
        "unitUsGal": "美制加侖",
        "unitImpGal": "英制加侖",
        "unitKnot": "節",
        "unitHp": "機械馬力",
    },
    "de": {
        "unitNmi": "Seemeilen (nmi)",
        "unitStone": "Stone (st)",
        "unitUsTsp": "US-Teelöffel",
        "unitUsTbsp": "US-Esslöffel",
        "unitUsCup": "US-Tassen",
        "unitUsGal": "US-Gallonen",
        "unitImpGal": "Imperiale Gallonen",
        "unitKnot": "Knoten",
        "unitHp": "Mechanische Pferdestärke",
        "unitMmHg": "Millimeter Quecksilbersäule",
        "unitMm2": "Quadratmillimeter",
        "unitCm2": "Quadratzentimeter",
        "unitKgf": "Kilopond",
    },
    "es": {
        "unitNmi": "Millas náuticas (nmi)",
        "unitStone": "Stone",
        "unitUsTsp": "Cucharaditas US",
        "unitUsTbsp": "Cucharadas US",
        "unitUsCup": "Tazas US",
        "unitUsGal": "Galones US",
        "unitImpGal": "Galones imperiales",
        "unitKnot": "Nudos",
        "unitHp": "Caballo de vapor mecánico",
        "unitMmHg": "Milímetros de mercurio",
        "unitMm2": "Milímetros cuadrados",
        "unitCm2": "Centímetros cuadrados",
        "unitKgf": "Kilogramo-fuerza",
    },
    "fr": {
        "unitNmi": "Milles nautiques (nmi)",
        "unitStone": "Stone",
        "unitUsTsp": "Cuillères à café US",
        "unitUsTbsp": "Cuillères à soupe US",
        "unitUsCup": "Tasses US",
        "unitUsGal": "Gallons US",
        "unitImpGal": "Gallons impériaux",
        "unitKnot": "Nœuds",
        "unitHp": "Cheval-vapeur mécanique",
        "unitYd": "Yards (yd)",
    },
    "it": {
        "unitNmi": "Miglia nautiche (nmi)",
        "unitStone": "Stone",
        "unitUsTsp": "Cucchiaini US",
        "unitUsTbsp": "Cucchiai US",
        "unitUsCup": "Tazze US",
        "unitUsGal": "Galloni US",
        "unitImpGal": "Galloni imperiali",
        "unitKnot": "Nodi",
        "unitHp": "Cavallo vapore meccanico",
    },
    "pt-BR": {
        "unitNmi": "Milhas náuticas (nmi)",
        "unitStone": "Stone",
        "unitUsTsp": "Colheres de chá US",
        "unitUsTbsp": "Colheres de sopa US",
        "unitUsCup": "Xícaras US",
        "unitUsGal": "Galões US",
        "unitImpGal": "Galões imperiais",
        "unitKnot": "Nós",
        "unitHp": "Cavalo-vapor mecânico",
    },
    "pt-PT": {
        "unitNmi": "Milhas náuticas (nmi)",
        "unitStone": "Stone",
        "unitUsTsp": "Colheres de chá US",
        "unitUsTbsp": "Colheres de sopa US",
        "unitUsCup": "Chávenas US",
        "unitUsGal": "Galões US",
        "unitImpGal": "Galões imperiais",
        "unitKnot": "Nós",
        "unitHp": "Cavalo-vapor mecânico",
    },
}

GENERIC_UNITS = {
    "cs": {"unitNmi": "Námořní míle (nmi)", "unitStone": "Stone", "unitUsTsp": "US čajové lžičky", "unitUsTbsp": "US polévkové lžíce", "unitUsCup": "US šálky", "unitUsGal": "US galony", "unitImpGal": "Imperiální galony", "unitKnot": "Uzly", "unitHp": "Mechanická koňská síla", "swapUnits": "Prohodit jednotky", "swapCurrencies": "Prohodit měny", "search": "Hledat", "searchAria": "Hledat {label}", "rateUnavailable": "Služba kurzů není dostupná"},
    "da": {"unitNmi": "Sømil (nmi)", "unitStone": "Stone", "unitUsTsp": "US teskefulde", "unitUsTbsp": "US spiseskefulde", "unitUsCup": "US kopper", "unitUsGal": "US gallons", "unitImpGal": "Imperial gallons", "unitKnot": "Knob", "unitHp": "Mekanisk hestekraft", "swapUnits": "Byt enheder", "swapCurrencies": "Byt valutaer", "search": "Søg", "searchAria": "Søg {label}", "rateUnavailable": "Kursstjeneste utilgængelig"},
    "el": {"unitNmi": "Ναυτικά μίλια (nmi)", "unitStone": "Stone", "unitUsTsp": "Κουταλάκια US", "unitUsTbsp": "Κουτάλια US", "unitUsCup": "Φλιτζάνια US", "unitUsGal": "Γαλόνια US", "unitImpGal": "Αυτοκρατορικά γαλόνια", "unitKnot": "Κόμβοι", "unitHp": "Μηχανικός ίππος", "swapUnits": "Εναλλαγή μονάδων", "swapCurrencies": "Εναλλαγή νομισμάτων", "search": "Αναζήτηση", "searchAria": "Αναζήτηση {label}", "rateUnavailable": "Η υπηρεσία ισοτιμιών δεν είναι διαθέσιμη"},
    "fi": {"unitNmi": "Meripeninkulmat (nmi)", "unitStone": "Stone", "unitUsTsp": "US teelusikat", "unitUsTbsp": "US ruokalusikat", "unitUsCup": "US kupit", "unitUsGal": "US gallonat", "unitImpGal": "Imperial-gallonat", "unitKnot": "Solmut", "unitHp": "Mekaaninen hevosvoima", "swapUnits": "Vaihda yksiköt", "swapCurrencies": "Vaihda valuutat", "search": "Haku", "searchAria": "Hae {label}", "rateUnavailable": "Kurssipalvelu ei ole käytettävissä"},
    "he": {"unitNmi": "מייל ימי (nmi)", "unitStone": "סטון", "unitUsTsp": "כפיות US", "unitUsTbsp": "כפות US", "unitUsCup": "כוסות US", "unitUsGal": "גלונים US", "unitImpGal": "גלונים אימפריאליים", "unitKnot": "קשר", "unitHp": "כוח סוס מכני", "swapUnits": "החלף יחידות", "swapCurrencies": "החלף מטבעות", "search": "חיפוש", "searchAria": "חיפוש {label}", "rateUnavailable": "שירות השערים אינו זמין"},
    "hi": {"unitNmi": "समुद्री मील (nmi)", "unitStone": "स्टोन", "unitUsTsp": "US चाय चम्मच", "unitUsTbsp": "US बड़े चम्मच", "unitUsCup": "US कप", "unitUsGal": "US गैलन", "unitImpGal": "इंपीरियल गैलन", "unitKnot": "नॉट", "unitHp": "यांत्रिक अश्वशक्ति", "swapUnits": "इकाइयाँ बदलें", "swapCurrencies": "मुद्राएँ बदलें", "search": "खोजें", "searchAria": "{label} खोजें", "rateUnavailable": "दर सेवा उपलब्ध नहीं"},
    "hu": {"unitNmi": "Tengeri mérföld (nmi)", "unitStone": "Stone", "unitUsTsp": "US teáskanál", "unitUsTbsp": "US evőkanál", "unitUsCup": "US csésze", "unitUsGal": "US gallon", "unitImpGal": "Birodalmi gallon", "unitKnot": "Csomó", "unitHp": "Mechanikai lóerő", "swapUnits": "Egységek csere", "swapCurrencies": "Pénznemek csere", "search": "Keresés", "searchAria": "{label} keresése", "rateUnavailable": "Az árfolyam-szolgáltatás nem érhető el"},
    "id": {"unitNmi": "Mil laut (nmi)", "unitStone": "Stone", "unitUsTsp": "Sendok teh US", "unitUsTbsp": "Sendok makan US", "unitUsCup": "Cangkir US", "unitUsGal": "Galon US", "unitImpGal": "Galon imperial", "unitKnot": "Knot", "unitHp": "Daya kuda mekanis", "swapUnits": "Tukar satuan", "swapCurrencies": "Tukar mata uang", "search": "Cari", "searchAria": "Cari {label}", "rateUnavailable": "Layanan kurs tidak tersedia"},
    "nb": {"unitNmi": "Nautiske mil (nmi)", "unitStone": "Stone", "unitUsTsp": "US teskjeer", "unitUsTbsp": "US spiseskjeer", "unitUsCup": "US kopper", "unitUsGal": "US gallon", "unitImpGal": "Imperial gallon", "unitKnot": "Knop", "unitHp": "Mekanisk hestekraft", "swapUnits": "Bytt enheter", "swapCurrencies": "Bytt valutaer", "search": "Søk", "searchAria": "Søk {label}", "rateUnavailable": "Kurstjenesten er utilgjengelig", "decimal": "Desimal", "minimum": "Minimum", "maximum": "Maksimum", "step": "Hoppet med", "count": "Hvor mange", "unique": "Ingen gjentakelser", "download": "Last ned listen", "batch": "Samling", "countHint": "Opptil {max} om gangen."},
    "nl": {"unitNmi": "Zeemijlen (nmi)", "unitStone": "Stone", "unitUsTsp": "US theelepels", "unitUsTbsp": "US eetlepels", "unitUsCup": "US cups", "unitUsGal": "US gallons", "unitImpGal": "Imperiale gallons", "unitKnot": "Knopen", "unitHp": "Mechanische paardenkracht", "swapUnits": "Eenheden wisselen", "swapCurrencies": "Valuta wisselen", "search": "Zoeken", "searchAria": "{label} zoeken", "rateUnavailable": "Koersdienst niet beschikbaar"},
    "pl": {"unitNmi": "Mile morskie (nmi)", "unitStone": "Stone", "unitUsTsp": "Łyżeczki US", "unitUsTbsp": "Łyżki US", "unitUsCup": "Filiżanki US", "unitUsGal": "Galony US", "unitImpGal": "Galony imperialne", "unitKnot": "Węzły", "unitHp": "Mechaniczny koń mechaniczny", "swapUnits": "Zamień jednostki", "swapCurrencies": "Zamień waluty", "search": "Szukaj", "searchAria": "Szukaj {label}", "rateUnavailable": "Usługa kursów jest niedostępna"},
    "ro": {"unitNmi": "Mile marine (nmi)", "unitStone": "Stone", "unitUsTsp": "Lingurițe US", "unitUsTbsp": "Linguri US", "unitUsCup": "Căni US", "unitUsGal": "Galoni US", "unitImpGal": "Galoni imperiali", "unitKnot": "Noduri", "unitHp": "Cal putere mecanic", "swapUnits": "Inversează unitățile", "swapCurrencies": "Inversează monedele", "search": "Caută", "searchAria": "Caută {label}", "rateUnavailable": "Serviciul de cursuri nu este disponibil"},
    "ru": {"unitNmi": "Морские мили (nmi)", "unitStone": "Стоун", "unitUsTsp": "Чайные ложки US", "unitUsTbsp": "Столовые ложки US", "unitUsCup": "Чашки US", "unitUsGal": "Галлоны US", "unitImpGal": "Имперские галлоны", "unitKnot": "Узлы", "unitHp": "Механическая лошадиная сила", "swapUnits": "Поменять единицы", "swapCurrencies": "Поменять валюты", "search": "Поиск", "searchAria": "Поиск {label}", "rateUnavailable": "Сервис курсов недоступен"},
    "sv": {"unitNmi": "Nautiska mil (nmi)", "unitStone": "Stone", "unitUsTsp": "US teskedar", "unitUsTbsp": "US matskedar", "unitUsCup": "US koppar", "unitUsGal": "US gallons", "unitImpGal": "Imperial gallons", "unitKnot": "Knop", "unitHp": "Mekanisk hästkraft", "swapUnits": "Byt enheter", "swapCurrencies": "Byt valutor", "search": "Sök", "searchAria": "Sök {label}", "rateUnavailable": "Kurstjänsten är otillgänglig"},
    "th": {"unitNmi": "ไมล์ทะเล (nmi)", "unitStone": "สโตน", "unitUsTsp": "ช้อนชา US", "unitUsTbsp": "ช้อนโต๊ะ US", "unitUsCup": "ถ้วย US", "unitUsGal": "แกลลอน US", "unitImpGal": "แกลลอนอิมพีเรียล", "unitKnot": "นอต", "unitHp": "แรงม้าเชิงกล", "swapUnits": "สลับหน่วย", "swapCurrencies": "สลับสกุลเงิน", "search": "ค้นหา", "searchAria": "ค้นหา {label}", "rateUnavailable": "บริการอัตราแลกเปลี่ยนใช้ไม่ได้"},
    "tr": {"unitNmi": "Deniz mili (nmi)", "unitStone": "Stone", "unitUsTsp": "US çay kaşığı", "unitUsTbsp": "US yemek kaşığı", "unitUsCup": "US su bardağı", "unitUsGal": "US galon", "unitImpGal": "Emperyal galon", "unitKnot": "Knot", "unitHp": "Mekanik beygir gücü", "swapUnits": "Birimleri değiştir", "swapCurrencies": "Para birimlerini değiştir", "search": "Ara", "searchAria": "{label} ara", "rateUnavailable": "Kur hizmeti kullanılamıyor"},
    "uk": {"unitNmi": "Морські милі (nmi)", "unitStone": "Стоун", "unitUsTsp": "Чайні ложки US", "unitUsTbsp": "Столові ложки US", "unitUsCup": "Чашки US", "unitUsGal": "Галони US", "unitImpGal": "Імперські галони", "unitKnot": "Вузли", "unitHp": "Механічна кінська сила", "swapUnits": "Поміняти одиниці", "swapCurrencies": "Поміняти валюти", "search": "Пошук", "searchAria": "Пошук {label}", "rateUnavailable": "Сервіс курсів недоступний"},
    "vi": {"unitNmi": "Hải lý (nmi)", "unitStone": "Stone", "unitUsTsp": "Muỗng cà phê US", "unitUsTbsp": "Muỗng canh US", "unitUsCup": "Tách US", "unitUsGal": "Gallon US", "unitImpGal": "Gallon đế quốc", "unitKnot": "Hải lý/giờ", "unitHp": "Mã lực cơ học", "swapUnits": "Đổi đơn vị", "swapCurrencies": "Đổi tiền tệ", "search": "Tìm", "searchAria": "Tìm {label}", "rateUnavailable": "Không dùng được dịch vụ tỷ giá"},
}

RANDOM_KEYS = {
    "decimal": {"nb": "Desimal", "de": "Dezimal", "es": "Decimal", "fr": "Décimal", "it": "Decimale", "pt-BR": "Decimal", "pt-PT": "Decimal", "ar": "عشري", "ja": "小数", "ko": "소수", "zh-Hans": "小数", "zh-Hant": "小數", "he": "עשרוני", "ru": "Десятичное", "uk": "Десяткове", "pl": "Dziesiętne", "nl": "Decimaal", "sv": "Decimal", "da": "Decimal", "fi": "Desimaali", "tr": "Ondalık", "th": "ทศนิยม", "vi": "Thập phân", "id": "Desimal", "hi": "दशमलव", "cs": "Desetinné", "hu": "Tizedes", "ro": "Zecimal", "el": "Δεκαδικός"},
    "step": {"nb": "Hoppet med", "ar": "الخطوة", "he": "קפיצה", "sv": "Steg", "da": "Trin", "fi": "Askel", "pl": "Krok", "ru": "Шаг", "uk": "Крок", "hi": "अंतराल", "tr": "Adım", "hu": "Lépés", "el": "Βήμα", "ro": "Pas", "cs": "Krok", "vi": "Bước", "id": "Langkah", "th": "ช่วง", "pt-BR": "De quanto em quanto", "pt-PT": "De quanto em quanto", "nl": "Stap", "it": "Passo"},
    "count": {"nb": "Hvor mange", "ar": "العدد", "he": "כמה", "sv": "Hur många", "da": "Hvor mange", "fi": "Kuinka monta", "pl": "Ile", "ru": "Сколько", "uk": "Скільки", "hi": "कितने", "tr": "Kaç tane", "hu": "Darab", "el": "Πόσα", "ro": "Câte", "cs": "Kolik", "vi": "Số lượng", "id": "Berapa", "th": "จำนวน", "pt-BR": "Quantos", "pt-PT": "Quantos", "nl": "Hoeveel", "it": "Quanti"},
    "unique": {"nb": "Ingen gjentakelser", "ar": "بدون تكرار", "he": "בלי חזרות", "sv": "Inga upprepningar", "da": "Ingen gentagelser", "fi": "Ei toistoja", "pl": "Bez powtórzeń", "ru": "Без повторов", "uk": "Без повторів", "hi": "दोहराव नहीं", "tr": "Tekrar yok", "hu": "Nincs ismétlés", "el": "Χωρίς επαναλήψεις", "ro": "Fără repetări", "cs": "Bez opakování", "vi": "Không trùng", "id": "Tanpa ulang", "th": "ไม่ซ้ำ", "pt-BR": "Sem repetir", "pt-PT": "Sem repetir", "nl": "Geen herhalingen", "it": "Niente ripetizioni"},
    "download": {"nb": "Last ned listen", "ar": "تنزيل القائمة", "he": "הורד רשימה", "sv": "Ladda ner listan", "da": "Download listen", "fi": "Lataa luettelo", "pl": "Pobierz listę", "ru": "Скачать список", "uk": "Завантажити список", "hi": "सूची डाउनलोड करें", "tr": "Listeyi indir", "hu": "Lista letöltése", "el": "Λήψη λίστας", "ro": "Descarcă lista", "cs": "Stáhnout seznam", "vi": "Tải danh sách", "id": "Unduh daftar", "th": "ดาวน์โหลดรายการ", "pt-BR": "Baixar lista", "pt-PT": "Descarregar lista", "nl": "Lijst downloaden", "it": "Scarica elenco"},
    "batch": {"nb": "Samling", "ar": "دفعة", "he": "אצווה", "sv": "Batch", "da": "Batch", "fi": "Erä", "pl": "Partia", "ru": "Пакет", "uk": "Пакет", "hi": "बैच", "tr": "Toplu", "hu": "Köteg", "el": "Πλήθος", "ro": "Lot", "cs": "Dávka", "vi": "Lô", "id": "Batch", "th": "ชุด", "pt-BR": "Lote", "pt-PT": "Lote", "nl": "Batch", "it": "Lotto"},
    "countHint": {"nb": "Opptil {max} om gangen.", "ar": "حتى {max} دفعة واحدة.", "he": "עד {max} בבת אחת.", "sv": "Upp till {max} åt gången.", "da": "Op til {max} ad gangen.", "fi": "Enintään {max} kerralla.", "pl": "Do {max} na raz.", "ru": "До {max} за раз.", "uk": "До {max} за раз.", "hi": "एक बार में {max} तक।", "tr": "Bir seferde en fazla {max}.", "hu": "Egyszerre legfeljebb {max}.", "el": "Έως {max} κάθε φορά.", "ro": "Până la {max} odată.", "cs": "Až {max} najednou.", "vi": "Tối đa {max} mỗi lần.", "id": "Hingga {max} sekaligus.", "th": "ได้สูงสุด {max} รายการต่อครั้ง", "pt-BR": "Até {max} de uma vez.", "pt-PT": "Até {max} de uma vez.", "nl": "Tot {max} tegelijk.", "it": "Fino a {max} alla volta."},
}

CURRENCY_NAMES = {
    "ar": ("محول العملات", "أسعار صرف مباشرة مع ذاكرة محلية"),
    "ja": ("通貨コンバーター", "ライブ為替レート（端末内キャッシュ）"),
    "ko": ("통화 변환기", "실시간 환율과 로컬 캐시"),
    "nb": ("Valutakalkulator", "Live valutakurser med lokal hurtigbuffer"),
    "es": ("Conversor de divisas", "Tipos de cambio en vivo con caché local"),
    "zh-Hans": ("货币转换器", "实时汇率，使用本地缓存"),
    "zh-Hant": ("貨幣轉換器", "即時匯率，使用本機快取"),
    "he": ("ממיר מטבעות", "שערי חליפין חיים עם מטמון מקומי"),
    "de": ("Währungsrechner", "Live-Wechselkurse mit lokalem Cache"),
    "fr": ("Convertisseur de devises", "Taux de change en direct avec cache local"),
    "it": ("Convertitore di valute", "Tassi di cambio in tempo reale con cache locale"),
    "pt-BR": ("Conversor de moedas", "Câmbio ao vivo com cache local"),
    "nl": ("Valutaconverter", "Live wisselkoersen met lokale cache"),
}


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def prune_currency(tools: dict) -> None:
    block = tools.get("currency-converter")
    if not isinstance(block, dict):
        return
    tools["currency-converter"] = {
        key: value
        for key, value in block.items()
        if key in CURRENCY_KEEP or key.startswith("currency")
    }


def apply_map(block: dict, mapping: dict[str, str]) -> None:
    for key, value in mapping.items():
        block[key] = value


def main() -> None:
    for path in sorted(MESSAGES.glob("*.json")):
        loc = path.stem
        data = load(path)
        tools = data.setdefault("tools", {})
        everyday = tools.setdefault("everyday-converter", {})
        random_gen = tools.setdefault("random-generator", {})
        currency = tools.setdefault("currency-converter", {})

        if loc in UNITS:
            apply_map(everyday, UNITS[loc])
        if loc in GENERIC_UNITS:
            apply_map(everyday, GENERIC_UNITS[loc])

        for key, per_loc in RANDOM_KEYS.items():
            if loc in per_loc:
                random_gen[key] = per_loc[loc]

        if loc in CURRENCY_NAMES:
            currency["name"], currency["description"] = CURRENCY_NAMES[loc]

        prune_currency(tools)
        dump(path, data)
        print(f"updated {path.name}")

    hans = load(MESSAGES / "zh-Hans.json")
    dump(MESSAGES / "zh.json", hans)
    print("updated zh.json (alias of zh-Hans)")


if __name__ == "__main__":
    main()
