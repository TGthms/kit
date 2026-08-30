#!/usr/bin/env python3
"""Fill leftover English tool chrome. Only replaces values that still equal English (or pdfDesc)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MESSAGES = ROOT / "messages"
EN = json.loads((MESSAGES / "en.json").read_text(encoding="utf-8"))


def set_path(obj: dict, path: str, value: str) -> None:
    parts = path.split(".")
    cur = obj
    for part in parts[:-1]:
        cur = cur[part]
    cur[parts[-1]] = value


# locale -> { dotted.path: translation }
COPY: dict[str, dict[str, str]] = {}

def add(locale: str, **keys: str) -> None:
    COPY.setdefault(locale, {}).update(keys)

# --- stopwatch-timer ---
add("es",
    **{"tools.stopwatch-timer.stopwatch": "Cronómetro", "tools.stopwatch-timer.countdown": "Cuenta atrás",
       "tools.stopwatch-timer.minutes": "Minutos", "tools.stopwatch-timer.seconds": "Segundos",
       "tools.stopwatch-timer.pause": "Pausa", "tools.stopwatch-timer.finished": "Terminado",
       "tools.stopwatch-timer.start": "Iniciar", "tools.stopwatch-timer.recordTime": "Registrar tiempo"})
add("fr",
    **{"tools.stopwatch-timer.stopwatch": "Chronomètre", "tools.stopwatch-timer.countdown": "Compte à rebours",
       "tools.stopwatch-timer.minutes": "Minutes", "tools.stopwatch-timer.seconds": "Secondes",
       "tools.stopwatch-timer.pause": "Pause", "tools.stopwatch-timer.finished": "Terminé",
       "tools.stopwatch-timer.start": "Démarrer", "tools.stopwatch-timer.recordTime": "Enregistrer le temps"})
add("de",
    **{"tools.stopwatch-timer.stopwatch": "Stoppuhr", "tools.stopwatch-timer.countdown": "Kurzzeitmesser",
       "tools.stopwatch-timer.minutes": "Minuten", "tools.stopwatch-timer.seconds": "Sekunden",
       "tools.stopwatch-timer.pause": "Pause", "tools.stopwatch-timer.finished": "Fertig",
       "tools.stopwatch-timer.start": "Starten", "tools.stopwatch-timer.recordTime": "Zeit speichern"})
add("it",
    **{"tools.stopwatch-timer.stopwatch": "Cronometro", "tools.stopwatch-timer.countdown": "Conto alla rovescia",
       "tools.stopwatch-timer.minutes": "Minuti", "tools.stopwatch-timer.seconds": "Secondi",
       "tools.stopwatch-timer.pause": "Pausa", "tools.stopwatch-timer.finished": "Finito",
       "tools.stopwatch-timer.start": "Avvia", "tools.stopwatch-timer.recordTime": "Registra tempo"})
add("pt-BR",
    **{"tools.stopwatch-timer.stopwatch": "Cronômetro", "tools.stopwatch-timer.countdown": "Contagem regressiva",
       "tools.stopwatch-timer.minutes": "Minutos", "tools.stopwatch-timer.seconds": "Segundos",
       "tools.stopwatch-timer.pause": "Pausar", "tools.stopwatch-timer.finished": "Concluído",
       "tools.stopwatch-timer.start": "Iniciar", "tools.stopwatch-timer.recordTime": "Registrar tempo"})
add("pt-PT",
    **{"tools.stopwatch-timer.stopwatch": "Cronómetro", "tools.stopwatch-timer.countdown": "Contagem decrescente",
       "tools.stopwatch-timer.minutes": "Minutos", "tools.stopwatch-timer.seconds": "Segundos",
       "tools.stopwatch-timer.pause": "Pausa", "tools.stopwatch-timer.finished": "Concluído",
       "tools.stopwatch-timer.start": "Iniciar", "tools.stopwatch-timer.recordTime": "Registar tempo"})
add("nl",
    **{"tools.stopwatch-timer.stopwatch": "Stopwatch", "tools.stopwatch-timer.countdown": "Aftellen",
       "tools.stopwatch-timer.minutes": "Minuten", "tools.stopwatch-timer.seconds": "Seconden",
       "tools.stopwatch-timer.pause": "Pauze", "tools.stopwatch-timer.finished": "Klaar",
       "tools.stopwatch-timer.start": "Start", "tools.stopwatch-timer.recordTime": "Tijd opslaan"})
add("da",
    **{"tools.stopwatch-timer.stopwatch": "Stopur", "tools.stopwatch-timer.countdown": "Nedtælling",
       "tools.stopwatch-timer.minutes": "Minutter", "tools.stopwatch-timer.seconds": "Sekunder",
       "tools.stopwatch-timer.pause": "Pause", "tools.stopwatch-timer.finished": "Færdig",
       "tools.stopwatch-timer.start": "Start", "tools.stopwatch-timer.recordTime": "Gem tid"})
add("sv",
    **{"tools.stopwatch-timer.stopwatch": "Stoppur", "tools.stopwatch-timer.countdown": "Nedräkning",
       "tools.stopwatch-timer.minutes": "Minuter", "tools.stopwatch-timer.seconds": "Sekunder",
       "tools.stopwatch-timer.pause": "Paus", "tools.stopwatch-timer.finished": "Klar",
       "tools.stopwatch-timer.start": "Starta", "tools.stopwatch-timer.recordTime": "Spara tid"})
add("nb",
    **{"tools.stopwatch-timer.stopwatch": "Stoppeklokke", "tools.stopwatch-timer.countdown": "Nedtelling",
       "tools.stopwatch-timer.minutes": "Minutter", "tools.stopwatch-timer.seconds": "Sekunder",
       "tools.stopwatch-timer.pause": "Pause", "tools.stopwatch-timer.finished": "Ferdig",
       "tools.stopwatch-timer.start": "Start", "tools.stopwatch-timer.recordTime": "Lagre tid"})
add("fi",
    **{"tools.stopwatch-timer.stopwatch": "Sekuntikello", "tools.stopwatch-timer.countdown": "Ajastin",
       "tools.stopwatch-timer.minutes": "Minuutit", "tools.stopwatch-timer.seconds": "Sekunnit",
       "tools.stopwatch-timer.pause": "Tauko", "tools.stopwatch-timer.finished": "Valmis",
       "tools.stopwatch-timer.start": "Käynnistä", "tools.stopwatch-timer.recordTime": "Tallenna aika"})
add("pl",
    **{"tools.stopwatch-timer.stopwatch": "Stoper", "tools.stopwatch-timer.countdown": "Odliczanie",
       "tools.stopwatch-timer.minutes": "Minuty", "tools.stopwatch-timer.seconds": "Sekundy",
       "tools.stopwatch-timer.pause": "Pauza", "tools.stopwatch-timer.finished": "Koniec",
       "tools.stopwatch-timer.start": "Start", "tools.stopwatch-timer.recordTime": "Zapisz czas"})
add("cs",
    **{"tools.stopwatch-timer.stopwatch": "Stopky", "tools.stopwatch-timer.countdown": "Odpočet",
       "tools.stopwatch-timer.minutes": "Minuty", "tools.stopwatch-timer.seconds": "Sekundy",
       "tools.stopwatch-timer.pause": "Pauza", "tools.stopwatch-timer.finished": "Hotovo",
       "tools.stopwatch-timer.start": "Start", "tools.stopwatch-timer.recordTime": "Uložit čas"})
add("hu",
    **{"tools.stopwatch-timer.stopwatch": "Stopper", "tools.stopwatch-timer.countdown": "Visszaszámláló",
       "tools.stopwatch-timer.minutes": "Perc", "tools.stopwatch-timer.seconds": "Másodperc",
       "tools.stopwatch-timer.pause": "Szünet", "tools.stopwatch-timer.finished": "Kész",
       "tools.stopwatch-timer.start": "Indítás", "tools.stopwatch-timer.recordTime": "Idő mentése"})
add("ro",
    **{"tools.stopwatch-timer.stopwatch": "Cronometru", "tools.stopwatch-timer.countdown": "Numărătoare inversă",
       "tools.stopwatch-timer.minutes": "Minute", "tools.stopwatch-timer.seconds": "Secunde",
       "tools.stopwatch-timer.pause": "Pauză", "tools.stopwatch-timer.finished": "Gata",
       "tools.stopwatch-timer.start": "Start", "tools.stopwatch-timer.recordTime": "Salvează timpul"})
add("el",
    **{"tools.stopwatch-timer.stopwatch": "Χρονόμετρο", "tools.stopwatch-timer.countdown": "Αντίστροφη μέτρηση",
       "tools.stopwatch-timer.minutes": "Λεπτά", "tools.stopwatch-timer.seconds": "Δευτερόλεπτα",
       "tools.stopwatch-timer.pause": "Παύση", "tools.stopwatch-timer.finished": "Τέλος",
       "tools.stopwatch-timer.start": "Έναρξη", "tools.stopwatch-timer.recordTime": "Αποθήκευση χρόνου"})
add("tr",
    **{"tools.stopwatch-timer.stopwatch": "Kronometre", "tools.stopwatch-timer.countdown": "Geri sayım",
       "tools.stopwatch-timer.minutes": "Dakika", "tools.stopwatch-timer.seconds": "Saniye",
       "tools.stopwatch-timer.pause": "Duraklat", "tools.stopwatch-timer.finished": "Bitti",
       "tools.stopwatch-timer.start": "Başlat", "tools.stopwatch-timer.recordTime": "Zamanı kaydet"})
add("ru",
    **{"tools.stopwatch-timer.stopwatch": "Секундомер", "tools.stopwatch-timer.countdown": "Обратный отсчёт",
       "tools.stopwatch-timer.minutes": "Минуты", "tools.stopwatch-timer.seconds": "Секунды",
       "tools.stopwatch-timer.pause": "Пауза", "tools.stopwatch-timer.finished": "Готово",
       "tools.stopwatch-timer.start": "Старт", "tools.stopwatch-timer.recordTime": "Сохранить время"})
add("uk",
    **{"tools.stopwatch-timer.stopwatch": "Секундомір", "tools.stopwatch-timer.countdown": "Зворотний відлік",
       "tools.stopwatch-timer.minutes": "Хвилини", "tools.stopwatch-timer.seconds": "Секунди",
       "tools.stopwatch-timer.pause": "Пауза", "tools.stopwatch-timer.finished": "Готово",
       "tools.stopwatch-timer.start": "Старт", "tools.stopwatch-timer.recordTime": "Зберегти час"})
add("ar",
    **{"tools.stopwatch-timer.stopwatch": "ساعة إيقاف", "tools.stopwatch-timer.countdown": "عد تنازلي",
       "tools.stopwatch-timer.minutes": "دقائق", "tools.stopwatch-timer.seconds": "ثوانٍ",
       "tools.stopwatch-timer.pause": "إيقاف مؤقت", "tools.stopwatch-timer.finished": "انتهى",
       "tools.stopwatch-timer.start": "ابدأ", "tools.stopwatch-timer.recordTime": "حفظ الوقت"})
add("he",
    **{"tools.stopwatch-timer.stopwatch": "שעון עצר", "tools.stopwatch-timer.countdown": "ספירה לאחור",
       "tools.stopwatch-timer.minutes": "דקות", "tools.stopwatch-timer.seconds": "שניות",
       "tools.stopwatch-timer.pause": "השהיה", "tools.stopwatch-timer.finished": "הסתיים",
       "tools.stopwatch-timer.start": "התחלה", "tools.stopwatch-timer.recordTime": "שמירת זמן"})
add("hi",
    **{"tools.stopwatch-timer.stopwatch": "स्टॉपवॉच", "tools.stopwatch-timer.countdown": "काउंटडाउन",
       "tools.stopwatch-timer.minutes": "मिनट", "tools.stopwatch-timer.seconds": "सेकंड",
       "tools.stopwatch-timer.pause": "रोकें", "tools.stopwatch-timer.finished": "समाप्त",
       "tools.stopwatch-timer.start": "शुरू", "tools.stopwatch-timer.recordTime": "समय सहेजें"})
add("th",
    **{"tools.stopwatch-timer.stopwatch": "นาฬิกาจับเวลา", "tools.stopwatch-timer.countdown": "นับถอยหลัง",
       "tools.stopwatch-timer.minutes": "นาที", "tools.stopwatch-timer.seconds": "วินาที",
       "tools.stopwatch-timer.pause": "หยุดชั่วคราว", "tools.stopwatch-timer.finished": "เสร็จแล้ว",
       "tools.stopwatch-timer.start": "เริ่ม", "tools.stopwatch-timer.recordTime": "บันทึกเวลา"})
add("vi",
    **{"tools.stopwatch-timer.stopwatch": "Đồng hồ bấm giờ", "tools.stopwatch-timer.countdown": "Đếm ngược",
       "tools.stopwatch-timer.minutes": "Phút", "tools.stopwatch-timer.seconds": "Giây",
       "tools.stopwatch-timer.pause": "Tạm dừng", "tools.stopwatch-timer.finished": "Xong",
       "tools.stopwatch-timer.start": "Bắt đầu", "tools.stopwatch-timer.recordTime": "Lưu thời gian"})
add("id",
    **{"tools.stopwatch-timer.stopwatch": "Stopwatch", "tools.stopwatch-timer.countdown": "Hitung mundur",
       "tools.stopwatch-timer.minutes": "Menit", "tools.stopwatch-timer.seconds": "Detik",
       "tools.stopwatch-timer.pause": "Jeda", "tools.stopwatch-timer.finished": "Selesai",
       "tools.stopwatch-timer.start": "Mulai", "tools.stopwatch-timer.recordTime": "Simpan waktu"})
add("ja",
    **{"tools.stopwatch-timer.stopwatch": "ストップウォッチ", "tools.stopwatch-timer.countdown": "カウントダウン",
       "tools.stopwatch-timer.minutes": "分", "tools.stopwatch-timer.seconds": "秒",
       "tools.stopwatch-timer.pause": "一時停止", "tools.stopwatch-timer.finished": "終了",
       "tools.stopwatch-timer.start": "開始", "tools.stopwatch-timer.recordTime": "時間を記録"})
add("ko",
    **{"tools.stopwatch-timer.stopwatch": "스톱워치", "tools.stopwatch-timer.countdown": "카운트다운",
       "tools.stopwatch-timer.minutes": "분", "tools.stopwatch-timer.seconds": "초",
       "tools.stopwatch-timer.pause": "일시정지", "tools.stopwatch-timer.finished": "완료",
       "tools.stopwatch-timer.start": "시작", "tools.stopwatch-timer.recordTime": "시간 기록"})
add("zh-Hans",
    **{"tools.stopwatch-timer.stopwatch": "秒表", "tools.stopwatch-timer.countdown": "倒计时",
       "tools.stopwatch-timer.minutes": "分钟", "tools.stopwatch-timer.seconds": "秒",
       "tools.stopwatch-timer.pause": "暂停", "tools.stopwatch-timer.finished": "结束",
       "tools.stopwatch-timer.start": "开始", "tools.stopwatch-timer.recordTime": "记录时间"})
add("zh-Hant",
    **{"tools.stopwatch-timer.stopwatch": "碼表", "tools.stopwatch-timer.countdown": "倒數計時",
       "tools.stopwatch-timer.minutes": "分鐘", "tools.stopwatch-timer.seconds": "秒",
       "tools.stopwatch-timer.pause": "暫停", "tools.stopwatch-timer.finished": "結束",
       "tools.stopwatch-timer.start": "開始", "tools.stopwatch-timer.recordTime": "記錄時間"})

# Shared leftover chrome for everyday tools (applied on top)
COMMON_CHROME = {
    "es": {
        "tools.random-generator.integer": "Entero", "tools.random-generator.decimal": "Decimal",
        "tools.random-generator.boolean": "Booleano", "tools.random-generator.pick": "Elegir",
        "tools.random-generator.password": "Contraseña", "tools.random-generator.minimum": "Mínimo",
        "tools.random-generator.maximum": "Máximo", "tools.random-generator.precision": "Precisión",
        "tools.random-generator.choices": "Opciones, una por línea", "tools.random-generator.passwordLength": "Longitud de contraseña",
        "tools.random-generator.copyResult": "Copiar resultado", "tools.random-generator.recentResults": "Resultados recientes",
        "tools.tip-split-calculator.subtotal": "Subtotal", "tools.tip-split-calculator.tipPercent": "Propina %",
        "tools.tip-split-calculator.taxPercent": "Impuesto %", "tools.tip-split-calculator.people": "Personas",
        "tools.tip-split-calculator.distributeRoundingRemainder": "Repartir el resto del redondeo",
        "tools.tip-split-calculator.tax": "Impuesto", "tools.tip-split-calculator.tip": "Propina",
        "tools.tip-split-calculator.total": "Total", "tools.tip-split-calculator.individualShares": "Partes individuales",
        "tools.tip-split-calculator.recordSplit": "Guardar división",
        "tools.text-counter.readTime": "Tiempo de lectura",
        "tools.text-counter.placeholder": "Pega o escribe texto para ver un perfil de lectura en vivo.",
        "tools.text-counter.noSpaces": "Sin espacios",
        "categories.pdfDesc": "Combina, divide, reduce y marca documentos PDF",
        "tools.images-to-pdf.success": "{count, plural, one {PDF creado a partir de # imagen.} other {PDF creado a partir de # imágenes.}}",
    },
}

# Fill remaining locales with a second table for random/tip/text/pdfDesc/i2p
MORE = {
    "fr": {
        "tools.random-generator.integer": "Entier", "tools.random-generator.decimal": "Décimal",
        "tools.random-generator.boolean": "Booléen", "tools.random-generator.pick": "Choisir",
        "tools.random-generator.password": "Mot de passe", "tools.random-generator.minimum": "Minimum",
        "tools.random-generator.maximum": "Maximum", "tools.random-generator.precision": "Précision",
        "tools.random-generator.choices": "Choix, un par ligne", "tools.random-generator.passwordLength": "Longueur du mot de passe",
        "tools.random-generator.copyResult": "Copier le résultat", "tools.random-generator.recentResults": "Résultats récents",
        "tools.tip-split-calculator.subtotal": "Sous-total", "tools.tip-split-calculator.tipPercent": "Pourboire %",
        "tools.tip-split-calculator.taxPercent": "Taxe %", "tools.tip-split-calculator.people": "Personnes",
        "tools.tip-split-calculator.distributeRoundingRemainder": "Répartir le reste d’arrondi",
        "tools.tip-split-calculator.tax": "Taxe", "tools.tip-split-calculator.tip": "Pourboire",
        "tools.tip-split-calculator.total": "Total", "tools.tip-split-calculator.individualShares": "Parts individuelles",
        "tools.tip-split-calculator.recordSplit": "Enregistrer le partage",
        "tools.text-counter.readTime": "Temps de lecture",
        "tools.text-counter.placeholder": "Collez ou saisissez du texte pour voir un profil de lecture en direct.",
        "tools.text-counter.noSpaces": "Sans espaces",
        "categories.pdfDesc": "Fusionnez, découpez, réduisez et annotez des PDF",
        "tools.images-to-pdf.success": "{count, plural, one {PDF créé à partir de # image.} other {PDF créé à partir de # images.}}",
        "tools.stopwatch-timer.minutes": "Minutes",
        "tools.stopwatch-timer.pause": "Pause",
    },
    "de": {
        "tools.random-generator.integer": "Ganzzahl", "tools.random-generator.decimal": "Dezimal",
        "tools.random-generator.boolean": "Wahr/Falsch", "tools.random-generator.pick": "Auswählen",
        "tools.random-generator.password": "Passwort", "tools.random-generator.minimum": "Minimum",
        "tools.random-generator.maximum": "Maximum", "tools.random-generator.precision": "Genauigkeit",
        "tools.random-generator.choices": "Auswahl, eine pro Zeile", "tools.random-generator.passwordLength": "Passwortlänge",
        "tools.random-generator.copyResult": "Ergebnis kopieren", "tools.random-generator.recentResults": "Letzte Ergebnisse",
        "tools.tip-split-calculator.subtotal": "Zwischensumme", "tools.tip-split-calculator.tipPercent": "Trinkgeld %",
        "tools.tip-split-calculator.taxPercent": "Steuer %", "tools.tip-split-calculator.people": "Personen",
        "tools.tip-split-calculator.distributeRoundingRemainder": "Rundungsrest verteilen",
        "tools.tip-split-calculator.tax": "Steuer", "tools.tip-split-calculator.tip": "Trinkgeld",
        "tools.tip-split-calculator.total": "Summe", "tools.tip-split-calculator.individualShares": "Einzelanteile",
        "tools.tip-split-calculator.recordSplit": "Teilung speichern",
        "tools.text-counter.readTime": "Lesezeit",
        "tools.text-counter.placeholder": "Text einfügen oder tippen, um ein Live-Leseprofil zu sehen.",
        "tools.text-counter.noSpaces": "Ohne Leerzeichen",
        "categories.pdfDesc": "PDF zusammenführen, teilen, verkleinern und markieren",
        "tools.images-to-pdf.success": "{count, plural, one {PDF aus # Bild erstellt.} other {PDF aus # Bildern erstellt.}}",
        "tools.stopwatch-timer.pause": "Pausieren",
        "tools.stopwatch-timer.start": "Starten",
    },
    "ja": {
        "tools.random-generator.integer": "整数", "tools.random-generator.decimal": "小数",
        "tools.random-generator.boolean": "真偽", "tools.random-generator.pick": "選ぶ",
        "tools.random-generator.password": "パスワード", "tools.random-generator.minimum": "最小",
        "tools.random-generator.maximum": "最大", "tools.random-generator.precision": "桁数",
        "tools.random-generator.choices": "候補（1行に1つ）", "tools.random-generator.passwordLength": "パスワードの長さ",
        "tools.random-generator.copyResult": "結果をコピー", "tools.random-generator.recentResults": "最近の結果",
        "tools.tip-split-calculator.subtotal": "小計", "tools.tip-split-calculator.tipPercent": "チップ %",
        "tools.tip-split-calculator.taxPercent": "税 %", "tools.tip-split-calculator.people": "人数",
        "tools.tip-split-calculator.distributeRoundingRemainder": "端数を分配",
        "tools.tip-split-calculator.tax": "税", "tools.tip-split-calculator.tip": "チップ",
        "tools.tip-split-calculator.total": "合計", "tools.tip-split-calculator.individualShares": "一人ずつ",
        "tools.tip-split-calculator.recordSplit": "割り勘を記録",
        "tools.text-counter.readTime": "読書時間",
        "tools.text-counter.placeholder": "テキストを貼るか入力すると、読みの目安がすぐに出ます。",
        "tools.text-counter.noSpaces": "空白なし",
        "categories.pdfDesc": "PDFの結合・分割・縮小・マークアップ",
        "tools.images-to-pdf.success": "{count, plural, other {# 枚の画像から PDF を作成しました。}}",
        "tools.timezone-converter.search": "検索",
        "tools.timezone-converter.searchAria": "{label}の検索",
    },
    "zh-Hans": {
        "tools.random-generator.integer": "整数", "tools.random-generator.decimal": "小数",
        "tools.random-generator.boolean": "布尔", "tools.random-generator.pick": "抽取",
        "tools.random-generator.password": "密码", "tools.random-generator.minimum": "最小",
        "tools.random-generator.maximum": "最大", "tools.random-generator.precision": "精度",
        "tools.random-generator.choices": "选项，每行一个", "tools.random-generator.passwordLength": "密码长度",
        "tools.random-generator.copyResult": "复制结果", "tools.random-generator.recentResults": "最近结果",
        "tools.tip-split-calculator.subtotal": "小计", "tools.tip-split-calculator.tipPercent": "小费 %",
        "tools.tip-split-calculator.taxPercent": "税 %", "tools.tip-split-calculator.people": "人数",
        "tools.tip-split-calculator.distributeRoundingRemainder": "分摊舍入余数",
        "tools.tip-split-calculator.tax": "税", "tools.tip-split-calculator.tip": "小费",
        "tools.tip-split-calculator.total": "总计", "tools.tip-split-calculator.individualShares": "各人份额",
        "tools.tip-split-calculator.recordSplit": "记录分账",
        "tools.text-counter.readTime": "阅读时间",
        "tools.text-counter.placeholder": "粘贴或输入文字，即可看到实时阅读概况。",
        "tools.text-counter.noSpaces": "不含空格",
        "categories.pdfDesc": "合并、拆分、缩小并标注 PDF",
        "tools.images-to-pdf.success": "{count, plural, other {已用 # 张图片生成 PDF。}}",
        "tools.timezone-converter.search": "搜索",
        "tools.timezone-converter.searchAria": "{label}搜索",
    },
    "zh-Hant": {
        "tools.random-generator.integer": "整數", "tools.random-generator.decimal": "小數",
        "tools.random-generator.boolean": "布林", "tools.random-generator.pick": "抽取",
        "tools.random-generator.password": "密碼", "tools.random-generator.minimum": "最小",
        "tools.random-generator.maximum": "最大", "tools.random-generator.precision": "精度",
        "tools.random-generator.choices": "選項，每行一個", "tools.random-generator.passwordLength": "密碼長度",
        "tools.random-generator.copyResult": "複製結果", "tools.random-generator.recentResults": "最近結果",
        "tools.tip-split-calculator.subtotal": "小計", "tools.tip-split-calculator.tipPercent": "小費 %",
        "tools.tip-split-calculator.taxPercent": "稅 %", "tools.tip-split-calculator.people": "人數",
        "tools.tip-split-calculator.distributeRoundingRemainder": "分攤捨入餘數",
        "tools.tip-split-calculator.tax": "稅", "tools.tip-split-calculator.tip": "小費",
        "tools.tip-split-calculator.total": "總計", "tools.tip-split-calculator.individualShares": "各人份額",
        "tools.tip-split-calculator.recordSplit": "記錄分帳",
        "tools.text-counter.readTime": "閱讀時間",
        "tools.text-counter.placeholder": "貼上或輸入文字，即可看到即時閱讀概況。",
        "tools.text-counter.noSpaces": "不含空格",
        "categories.pdfDesc": "合併、分割、縮小並標註 PDF",
        "tools.images-to-pdf.success": "{count, plural, other {已用 # 張圖片產生 PDF。}}",
    },
    "ar": {
        "tools.random-generator.integer": "عدد صحيح", "tools.random-generator.decimal": "عشري",
        "tools.random-generator.boolean": "منطقي", "tools.random-generator.pick": "اختيار",
        "tools.random-generator.password": "كلمة مرور", "tools.random-generator.minimum": "الحد الأدنى",
        "tools.random-generator.maximum": "الحد الأقصى", "tools.random-generator.precision": "الدقة",
        "tools.random-generator.choices": "خيارات، واحد في كل سطر", "tools.random-generator.passwordLength": "طول كلمة المرور",
        "tools.random-generator.copyResult": "نسخ النتيجة", "tools.random-generator.recentResults": "نتائج أخيرة",
        "tools.tip-split-calculator.subtotal": "المجموع الفرعي", "tools.tip-split-calculator.tipPercent": "إكرامية %",
        "tools.tip-split-calculator.taxPercent": "ضريبة %", "tools.tip-split-calculator.people": "أشخاص",
        "tools.tip-split-calculator.distributeRoundingRemainder": "توزيع باقي التقريب",
        "tools.tip-split-calculator.tax": "ضريبة", "tools.tip-split-calculator.tip": "إكرامية",
        "tools.tip-split-calculator.total": "الإجمالي", "tools.tip-split-calculator.individualShares": "حصص فردية",
        "tools.tip-split-calculator.recordSplit": "حفظ التقسيم",
        "tools.text-counter.readTime": "وقت القراءة",
        "tools.text-counter.placeholder": "الصق نصًا أو اكتبه لترى ملخص قراءة فوريًا.",
        "tools.text-counter.noSpaces": "بدون مسافات",
        "categories.pdfDesc": "ادمج وقسّم وصغّر وعلّم مستندات PDF",
        "tools.images-to-pdf.success": "{count, plural, zero {أُنشئ PDF من # صور.} one {أُنشئ PDF من صورة واحدة.} two {أُنشئ PDF من صورتين.} few {أُنشئ PDF من # صور.} many {أُنشئ PDF من # صورة.} other {أُنشئ PDF من # صورة.}}",
        "tools.timezone-converter.search": "بحث",
        "tools.timezone-converter.searchAria": "بحث {label}",
    },
    "he": {
        "tools.random-generator.integer": "שלם", "tools.random-generator.decimal": "עשרוני",
        "tools.random-generator.boolean": "בוליאני", "tools.random-generator.pick": "בחירה",
        "tools.random-generator.password": "סיסמה", "tools.random-generator.minimum": "מינימום",
        "tools.random-generator.maximum": "מקסימום", "tools.random-generator.precision": "דיוק",
        "tools.random-generator.choices": "אפשרויות, אחת בכל שורה", "tools.random-generator.passwordLength": "אורך סיסמה",
        "tools.random-generator.copyResult": "העתקת תוצאה", "tools.random-generator.recentResults": "תוצאות אחרונות",
        "tools.tip-split-calculator.subtotal": "ביניים", "tools.tip-split-calculator.tipPercent": "טיפ %",
        "tools.tip-split-calculator.taxPercent": "מס %", "tools.tip-split-calculator.people": "אנשים",
        "tools.tip-split-calculator.distributeRoundingRemainder": "פזר את שארית העיגול",
        "tools.tip-split-calculator.tax": "מס", "tools.tip-split-calculator.tip": "טיפ",
        "tools.tip-split-calculator.total": "סה״כ", "tools.tip-split-calculator.individualShares": "חלקים אישיים",
        "tools.tip-split-calculator.recordSplit": "שמירת חלוקה",
        "tools.text-counter.readTime": "זמן קריאה",
        "tools.text-counter.placeholder": "הדביקו או הקלידו טקסט לפרופיל קריאה חי.",
        "tools.text-counter.noSpaces": "בלי רווחים",
        "categories.pdfDesc": "מיזוג, פיצול, כיווץ וסימון של PDF",
        "tools.images-to-pdf.success": "{count, plural, one {נוצר PDF מתמונה אחת.} two {נוצר PDF משתי תמונות.} other {נוצר PDF מ-# תמונות.}}",
        "tools.timezone-converter.search": "חיפוש",
        "tools.timezone-converter.searchAria": "חיפוש {label}",
    },
    "hi": {
        "tools.random-generator.integer": "पूर्णांक", "tools.random-generator.decimal": "दशमलव",
        "tools.random-generator.boolean": "बूलियन", "tools.random-generator.pick": "चुनें",
        "tools.random-generator.password": "पासवर्ड", "tools.random-generator.minimum": "न्यूनतम",
        "tools.random-generator.maximum": "अधिकतम", "tools.random-generator.precision": "सटीकता",
        "tools.random-generator.choices": "विकल्प, एक प्रति पंक्ति", "tools.random-generator.passwordLength": "पासवर्ड लंबाई",
        "tools.random-generator.copyResult": "परिणाम कॉपी करें", "tools.random-generator.recentResults": "हाल के परिणाम",
        "tools.tip-split-calculator.subtotal": "उपयोग", "tools.tip-split-calculator.tipPercent": "टिप %",
        "tools.tip-split-calculator.taxPercent": "कर %", "tools.tip-split-calculator.people": "लोग",
        "tools.tip-split-calculator.distributeRoundingRemainder": "पूर्णांक शेष बाँटें",
        "tools.tip-split-calculator.tax": "कर", "tools.tip-split-calculator.tip": "टिप",
        "tools.tip-split-calculator.total": "कुल", "tools.tip-split-calculator.individualShares": "व्यक्तिगत हिस्से",
        "tools.tip-split-calculator.recordSplit": "बँटवारा सहेजें",
        "tools.text-counter.readTime": "पढ़ने का समय",
        "tools.text-counter.placeholder": "पाठ चिपकाएँ या लिखें, पढ़ने का प्रोफ़ाइल तुरंत दिखेगा।",
        "tools.text-counter.noSpaces": "बिना स्पेस",
        "categories.pdfDesc": "PDF मिलाएँ, बाँटें, सिकोड़ें और चिह्नित करें",
        "tools.images-to-pdf.success": "{count, plural, one {# छवि से PDF बना।} other {# छवियों से PDF बना।}}",
        "tools.timezone-converter.search": "खोज",
        "tools.timezone-converter.searchAria": "{label} खोज",
    },
    "ko": {
        "tools.random-generator.integer": "정수", "tools.random-generator.decimal": "소수",
        "tools.random-generator.boolean": "참/거짓", "tools.random-generator.pick": "뽑기",
        "tools.random-generator.password": "비밀번호", "tools.random-generator.minimum": "최소",
        "tools.random-generator.maximum": "최대", "tools.random-generator.precision": "자릿수",
        "tools.random-generator.choices": "항목, 한 줄에 하나", "tools.random-generator.passwordLength": "비밀번호 길이",
        "tools.random-generator.copyResult": "결과 복사", "tools.random-generator.recentResults": "최근 결과",
        "tools.tip-split-calculator.subtotal": "소계", "tools.tip-split-calculator.tipPercent": "팁 %",
        "tools.tip-split-calculator.taxPercent": "세금 %", "tools.tip-split-calculator.people": "인원",
        "tools.tip-split-calculator.distributeRoundingRemainder": "반올림 나머지 나누기",
        "tools.tip-split-calculator.tax": "세금", "tools.tip-split-calculator.tip": "팁",
        "tools.tip-split-calculator.total": "합계", "tools.tip-split-calculator.individualShares": "개인 몫",
        "tools.tip-split-calculator.recordSplit": "나누기 기록",
        "tools.text-counter.readTime": "읽기 시간",
        "tools.text-counter.placeholder": "텍스트를 붙여넣거나 입력하면 읽기 프로필이 바로 나옵니다.",
        "tools.text-counter.noSpaces": "공백 제외",
        "categories.pdfDesc": "PDF 합치기, 나누기, 줄이기, 표시",
        "tools.images-to-pdf.success": "{count, plural, other {이미지 #장으로 PDF를 만들었습니다.}}",
    },
    "ru": {
        "tools.random-generator.integer": "Целое", "tools.random-generator.decimal": "Дробное",
        "tools.random-generator.boolean": "Логическое", "tools.random-generator.pick": "Выбрать",
        "tools.random-generator.password": "Пароль", "tools.random-generator.minimum": "Минимум",
        "tools.random-generator.maximum": "Максимум", "tools.random-generator.precision": "Точность",
        "tools.random-generator.choices": "Варианты, по одному в строке", "tools.random-generator.passwordLength": "Длина пароля",
        "tools.random-generator.copyResult": "Копировать результат", "tools.random-generator.recentResults": "Недавние результаты",
        "tools.tip-split-calculator.subtotal": "Промежуточный итог", "tools.tip-split-calculator.tipPercent": "Чаевые %",
        "tools.tip-split-calculator.taxPercent": "Налог %", "tools.tip-split-calculator.people": "Люди",
        "tools.tip-split-calculator.distributeRoundingRemainder": "Распределить остаток округления",
        "tools.tip-split-calculator.tax": "Налог", "tools.tip-split-calculator.tip": "Чаевые",
        "tools.tip-split-calculator.total": "Итого", "tools.tip-split-calculator.individualShares": "Доли",
        "tools.tip-split-calculator.recordSplit": "Сохранить деление",
        "tools.text-counter.readTime": "Время чтения",
        "tools.text-counter.placeholder": "Вставьте или введите текст, чтобы увидеть профиль чтения.",
        "tools.text-counter.noSpaces": "Без пробелов",
        "categories.pdfDesc": "Объединяйте, делитесь, сжимайте и размечайте PDF",
        "tools.images-to-pdf.success": "{count, plural, one {PDF из # изображения.} few {PDF из # изображений.} many {PDF из # изображений.} other {PDF из # изображения.}}",
    },
    "nl": {
        "tools.random-generator.integer": "Geheel", "tools.random-generator.decimal": "Decimaal",
        "tools.random-generator.boolean": "Booleaans", "tools.random-generator.pick": "Kiezen",
        "tools.random-generator.password": "Wachtwoord", "tools.random-generator.minimum": "Minimum",
        "tools.random-generator.maximum": "Maximum", "tools.random-generator.precision": "Precisie",
        "tools.random-generator.choices": "Keuzes, één per regel", "tools.random-generator.passwordLength": "Wachtwoordlengte",
        "tools.random-generator.copyResult": "Resultaat kopiëren", "tools.random-generator.recentResults": "Recente resultaten",
        "tools.tip-split-calculator.subtotal": "Subtotaal", "tools.tip-split-calculator.tipPercent": "Fooi %",
        "tools.tip-split-calculator.taxPercent": "Belasting %", "tools.tip-split-calculator.people": "Personen",
        "tools.tip-split-calculator.distributeRoundingRemainder": "Afrondingsrest verdelen",
        "tools.tip-split-calculator.tax": "Belasting", "tools.tip-split-calculator.tip": "Fooi",
        "tools.tip-split-calculator.total": "Totaal", "tools.tip-split-calculator.individualShares": "Individuele delen",
        "tools.tip-split-calculator.recordSplit": "Verdeling opslaan",
        "tools.text-counter.readTime": "Leestijd",
        "tools.text-counter.placeholder": "Plak of typ tekst voor een live leesprofiel.",
        "tools.text-counter.noSpaces": "Zonder spaties",
        "categories.pdfDesc": "PDF’s samenvoegen, splitsen, verkleinen en markeren",
        "tools.images-to-pdf.success": "{count, plural, one {PDF gemaakt van # afbeelding.} other {PDF gemaakt van # afbeeldingen.}}",
        "tools.stopwatch-timer.stopwatch": "Stopwatch",
        "tools.stopwatch-timer.start": "Start",
        "tools.stopwatch-timer.minutes": "Minuten",
        "tools.stopwatch-timer.seconds": "Seconden",
    },
}

# Remaining European/SE Asian locales get a compact shared MORE block
GENERIC = {
    "it": ("Intero", "Decimale", "Booleano", "Scegli", "Password", "Minimo", "Massimo", "Precisione",
           "Scelte, una per riga", "Lunghezza password", "Copia risultato", "Risultati recenti",
           "Imponibile", "Mancia %", "Tassa %", "Persone", "Distribuisci il resto dell’arrotondamento",
           "Tassa", "Mancia", "Totale", "Quote individuali", "Salva divisione",
           "Tempo di lettura", "Incolla o scrivi testo per un profilo di lettura in tempo reale.", "Senza spazi",
           "Unisci, dividi, riduci e annota PDF",
           "{count, plural, one {PDF creato da # immagine.} other {PDF creato da # immagini.}}"),
    "pt-BR": ("Inteiro", "Decimal", "Booleano", "Sortear", "Senha", "Mínimo", "Máximo", "Precisão",
              "Opções, uma por linha", "Tamanho da senha", "Copiar resultado", "Resultados recentes",
              "Subtotal", "Gorjeta %", "Imposto %", "Pessoas", "Distribuir o resto do arredondamento",
              "Imposto", "Gorjeta", "Total", "Cotas individuais", "Registrar divisão",
              "Tempo de leitura", "Cole ou digite texto para ver um perfil de leitura ao vivo.", "Sem espaços",
              "Junte, divida, reduza e marque PDFs",
              "{count, plural, one {PDF criado a partir de # imagem.} other {PDF criado a partir de # imagens.}}"),
    "pt-PT": ("Inteiro", "Decimal", "Booleano", "Escolher", "Palavra-passe", "Mínimo", "Máximo", "Precisão",
              "Opções, uma por linha", "Comprimento da palavra-passe", "Copiar resultado", "Resultados recentes",
              "Subtotal", "Gorjeta %", "Imposto %", "Pessoas", "Distribuir o resto do arredondamento",
              "Imposto", "Gorjeta", "Total", "Partes individuais", "Registar divisão",
              "Tempo de leitura", "Cole ou escreva texto para ver um perfil de leitura em direto.", "Sem espaços",
              "Juntar, dividir, reduzir e marcar PDFs",
              "{count, plural, one {PDF criado a partir de # imagem.} other {PDF criado a partir de # imagens.}}"),
}


def pack_generic(values: tuple[str, ...]) -> dict[str, str]:
    keys = [
        "tools.random-generator.integer", "tools.random-generator.decimal", "tools.random-generator.boolean",
        "tools.random-generator.pick", "tools.random-generator.password", "tools.random-generator.minimum",
        "tools.random-generator.maximum", "tools.random-generator.precision", "tools.random-generator.choices",
        "tools.random-generator.passwordLength", "tools.random-generator.copyResult", "tools.random-generator.recentResults",
        "tools.tip-split-calculator.subtotal", "tools.tip-split-calculator.tipPercent", "tools.tip-split-calculator.taxPercent",
        "tools.tip-split-calculator.people", "tools.tip-split-calculator.distributeRoundingRemainder",
        "tools.tip-split-calculator.tax", "tools.tip-split-calculator.tip", "tools.tip-split-calculator.total",
        "tools.tip-split-calculator.individualShares", "tools.tip-split-calculator.recordSplit",
        "tools.text-counter.readTime", "tools.text-counter.placeholder", "tools.text-counter.noSpaces",
        "categories.pdfDesc", "tools.images-to-pdf.success",
    ]
    return dict(zip(keys, values))


for loc, vals in GENERIC.items():
    MORE[loc] = pack_generic(vals)

# Clone a compact set for remaining locales from a nearby language
FALLBACK_FROM = {
    "da": "sv", "nb": "sv", "sv": None, "fi": None, "pl": None, "cs": None, "hu": None, "ro": None,
    "el": None, "tr": None, "uk": "ru", "id": None, "th": None, "vi": None,
}

MORE["sv"] = {
    "tools.random-generator.integer": "Heltal", "tools.random-generator.decimal": "Decimal",
    "tools.random-generator.boolean": "Boolesk", "tools.random-generator.pick": "Välj",
    "tools.random-generator.password": "Lösenord", "tools.random-generator.minimum": "Minimum",
    "tools.random-generator.maximum": "Maximum", "tools.random-generator.precision": "Precision",
    "tools.random-generator.choices": "Val, ett per rad", "tools.random-generator.passwordLength": "Lösenordslängd",
    "tools.random-generator.copyResult": "Kopiera resultat", "tools.random-generator.recentResults": "Senaste resultat",
    "tools.tip-split-calculator.subtotal": "Delsumma", "tools.tip-split-calculator.tipPercent": "Dricks %",
    "tools.tip-split-calculator.taxPercent": "Skatt %", "tools.tip-split-calculator.people": "Personer",
    "tools.tip-split-calculator.distributeRoundingRemainder": "Fördela avrundningsrest",
    "tools.tip-split-calculator.tax": "Skatt", "tools.tip-split-calculator.tip": "Dricks",
    "tools.tip-split-calculator.total": "Totalt", "tools.tip-split-calculator.individualShares": "Individuella andelar",
    "tools.tip-split-calculator.recordSplit": "Spara delning",
    "tools.text-counter.readTime": "Lästid",
    "tools.text-counter.placeholder": "Klistra in eller skriv text för en live-läsprofil.",
    "tools.text-counter.noSpaces": "Utan mellanslag",
    "categories.pdfDesc": "Slå ihop, dela, förminska och märk PDF-filer",
    "tools.images-to-pdf.success": "{count, plural, one {PDF skapad från # bild.} other {PDF skapad från # bilder.}}",
}
MORE["da"] = {**MORE["sv"], **{
    "tools.random-generator.integer": "Heltal", "tools.random-generator.pick": "Vælg",
    "tools.random-generator.password": "Adgangskode", "tools.random-generator.choices": "Valg, én pr. linje",
    "tools.random-generator.passwordLength": "Adgangskodelængde", "tools.random-generator.copyResult": "Kopiér resultat",
    "tools.random-generator.recentResults": "Seneste resultater",
    "tools.tip-split-calculator.subtotal": "Subtotal", "tools.tip-split-calculator.tipPercent": "Drikkepenge %",
    "tools.tip-split-calculator.taxPercent": "Moms %", "tools.tip-split-calculator.people": "Personer",
    "tools.tip-split-calculator.distributeRoundingRemainder": "Fordel afrundingsrest",
    "tools.tip-split-calculator.tax": "Moms", "tools.tip-split-calculator.tip": "Drikkepenge",
    "tools.tip-split-calculator.recordSplit": "Gem deling",
    "tools.text-counter.readTime": "Læsetid",
    "tools.text-counter.placeholder": "Indsæt eller skriv tekst for en live læseprofil.",
    "tools.text-counter.noSpaces": "Uden mellemrum",
    "categories.pdfDesc": "Flet, split, formindsk og marker PDF-filer",
    "tools.images-to-pdf.success": "{count, plural, one {PDF oprettet fra # billede.} other {PDF oprettet fra # billeder.}}",
}}
MORE["nb"] = {**MORE["sv"], **{
    "tools.random-generator.pick": "Velg", "tools.random-generator.password": "Passord",
    "tools.random-generator.choices": "Valg, én per linje", "tools.random-generator.passwordLength": "Passordlengde",
    "tools.random-generator.copyResult": "Kopier resultat", "tools.random-generator.recentResults": "Nylige resultater",
    "tools.tip-split-calculator.tipPercent": "Tips %", "tools.tip-split-calculator.taxPercent": "Mva %",
    "tools.tip-split-calculator.distributeRoundingRemainder": "Fordel avrundingsrest",
    "tools.tip-split-calculator.tax": "Mva", "tools.tip-split-calculator.tip": "Tips",
    "tools.tip-split-calculator.recordSplit": "Lagre deling",
    "tools.text-counter.readTime": "Lesetid",
    "tools.text-counter.placeholder": "Lim inn eller skriv tekst for en live leseprofil.",
    "tools.text-counter.noSpaces": "Uten mellomrom",
    "categories.pdfDesc": "Slå sammen, del, forminsk og merk PDF-filer",
    "tools.images-to-pdf.success": "{count, plural, one {PDF laget fra # bilde.} other {PDF laget fra # bilder.}}",
}}
MORE["pl"] = pack_generic((
    "Całkowita", "Dziesiętna", "Logiczna", "Wybierz", "Hasło", "Minimum", "Maksimum", "Precyzja",
    "Opcje, po jednej w wierszu", "Długość hasła", "Kopiuj wynik", "Ostatnie wyniki",
    "Suma częściowa", "Napiwek %", "Podatek %", "Osoby", "Rozdziel resztę zaokrąglenia",
    "Podatek", "Napiwek", "Suma", "Udziały", "Zapisz podział",
    "Czas czytania", "Wklej lub wpisz tekst, by zobaczyć profil czytania na żywo.", "Bez spacji",
    "Łącz, dziel, zmniejszaj i oznaczaj PDF-y",
    "{count, plural, one {PDF z # obrazu.} few {PDF z # obrazów.} many {PDF z # obrazów.} other {PDF z # obrazu.}}",
))
MORE["cs"] = pack_generic((
    "Celé číslo", "Desetinné", "Boolean", "Vybrat", "Heslo", "Minimum", "Maximum", "Přesnost",
    "Volby, jedna na řádek", "Délka hesla", "Kopírovat výsledek", "Nedávné výsledky",
    "Mezisoučet", "Spropitné %", "Daň %", "Lidé", "Rozdělit zbytek zaokrouhlení",
    "Daň", "Spropitné", "Celkem", "Jednotlivé podíly", "Uložit rozdělení",
    "Čas čtení", "Vložte nebo napište text pro živý profil čtení.", "Bez mezer",
    "Slučujte, dělte, zmenšujte a označujte PDF",
    "{count, plural, one {PDF z # obrázku.} few {PDF z # obrázků.} other {PDF z # obrázků.}}",
))
MORE["hu"] = pack_generic((
    "Egész", "Tizedes", "Logikai", "Választ", "Jelszó", "Minimum", "Maximum", "Pontosság",
    "Opciók, soronként egy", "Jelszó hossza", "Eredmény másolása", "Legutóbbi eredmények",
    "Részösszeg", "Borravaló %", "Adó %", "Emberek", "Kerekítési maradék elosztása",
    "Adó", "Borravaló", "Összesen", "Egyéni részek", "Osztás mentése",
    "Olvasási idő", "Illesszen be vagy írjon szöveget az élő olvasási profilhoz.", "Szóköz nélkül",
    "PDF összefűzése, darabolása, kicsinyítése és jelölése",
    "{count, plural, one {PDF # képből.} other {PDF # képből.}}",
))
MORE["ro"] = pack_generic((
    "Întreg", "Zecimal", "Boolean", "Alege", "Parolă", "Minim", "Maxim", "Precizie",
    "Opțiuni, una pe linie", "Lungimea parolei", "Copiază rezultatul", "Rezultate recente",
    "Subtotal", "Bacșiș %", "Taxă %", "Persoane", "Distribuie restul rotunjirii",
    "Taxă", "Bacșiș", "Total", "Părți individuale", "Salvează împărțirea",
    "Timp de citire", "Lipește sau scrie text pentru un profil de citire live.", "Fără spații",
    "Unește, împarte, micșorează și marchează PDF-uri",
    "{count, plural, one {PDF creat din # imagine.} few {PDF creat din # imagini.} other {PDF creat din # de imagini.}}",
))
MORE["el"] = pack_generic((
    "Ακέραιος", "Δεκαδικός", "Λογικό", "Επιλογή", "Κωδικός", "Ελάχιστο", "Μέγιστο", "Ακρίβεια",
    "Επιλογές, μία ανά γραμμή", "Μήκος κωδικού", "Αντιγραφή αποτελέσματος", "Πρόσφατα αποτελέσματα",
    "Μερικό σύνολο", "Φιλοδώρημα %", "Φόρος %", "Άτομα", "Κατανομή υπολοίπου στρογγυλοποίησης",
    "Φόρος", "Φιλοδώρημα", "Σύνολο", "Ατομικά μερίδια", "Αποθήκευση μοιράσματος",
    "Χρόνος ανάγνωσης", "Επικολλήστε ή πληκτρολογήστε κείμενο για ζωντανό προφίλ ανάγνωσης.", "Χωρίς κενά",
    "Συγχώνευση, διαχωρισμός, σμίκρυνση και σήμανση PDF",
    "{count, plural, one {PDF από # εικόνα.} other {PDF από # εικόνες.}}",
))
MORE["tr"] = pack_generic((
    "Tam sayı", "Ondalık", "Mantıksal", "Seç", "Parola", "En az", "En çok", "Hassasiyet",
    "Seçenekler, satır başına bir", "Parola uzunluğu", "Sonucu kopyala", "Son sonuçlar",
    "Ara toplam", "Bahşiş %", "Vergi %", "Kişi", "Yuvarlama kalanını dağıt",
    "Vergi", "Bahşiş", "Toplam", "Kişisel paylar", "Bölüşümü kaydet",
    "Okuma süresi", "Canlı okuma profili için metin yapıştırın veya yazın.", "Boşluksuz",
    "PDF birleştir, böl, küçült ve işaretle",
    "{count, plural, one {# görüntüden PDF.} other {# görüntüden PDF.}}",
))
MORE["fi"] = pack_generic((
    "Kokonaisluku", "Desimaali", "Totuusarvo", "Valitse", "Salasana", "Minimi", "Maksimi", "Tarkkuus",
    "Vaihtoehdot, yksi per rivi", "Salasanan pituus", "Kopioi tulos", "Viimeisimmät tulokset",
    "Välisumma", "Tippi %", "Vero %", "Henkilöt", "Pyöristysjäännöksen jako",
    "Vero", "Tippi", "Yhteensä", "Osuudet", "Tallenna jako",
    "Lukuaika", "Liitä tai kirjoita tekstiä nähdäksesi lukuprofiilin heti.", "Ilman välilyöntejä",
    "Yhdistä, jaa, pienennä ja merkitse PDF-tiedostoja",
    "{count, plural, one {PDF # kuvasta.} other {PDF # kuvasta.}}",
))
MORE["uk"] = pack_generic((
    "Ціле", "Дробове", "Логічне", "Обрати", "Пароль", "Мінімум", "Максимум", "Точність",
    "Варіанти, по одному в рядку", "Довжина пароля", "Копіювати результат", "Недавні результати",
    "Проміжний підсумок", "Чайові %", "Податок %", "Люди", "Розподілити залишок округлення",
    "Податок", "Чайові", "Разом", "Частки", "Зберегти поділ",
    "Час читання", "Вставте або введіть текст, щоб побачити профіль читання.", "Без пробілів",
    "Об’єднуйте, діліть, стискайте й розмічайте PDF",
    "{count, plural, one {PDF з # зображення.} few {PDF з # зображень.} many {PDF з # зображень.} other {PDF з # зображення.}}",
))
MORE["id"] = pack_generic((
    "Bilangan bulat", "Desimal", "Boolean", "Pilih", "Kata sandi", "Minimum", "Maksimum", "Presisi",
    "Pilihan, satu per baris", "Panjang kata sandi", "Salin hasil", "Hasil terbaru",
    "Subtotal", "Tip %", "Pajak %", "Orang", "Bagikan sisa pembulatan",
    "Pajak", "Tip", "Total", "Bagian per orang", "Simpan pembagian",
    "Waktu baca", "Tempel atau ketik teks untuk profil baca langsung.", "Tanpa spasi",
    "Gabung, pecah, kecilkan, dan tandai PDF",
    "{count, plural, other {PDF dibuat dari # gambar.}}",
))
MORE["th"] = pack_generic((
    "จำนวนเต็ม", "ทศนิยม", "บูลีน", "สุ่มเลือก", "รหัสผ่าน", "ต่ำสุด", "สูงสุด", "ความละเอียด",
    "ตัวเลือก บรรทัดละหนึ่ง", "ความยาวรหัสผ่าน", "คัดลอกผลลัพธ์", "ผลลัพธ์ล่าสุด",
    "ยอดก่อนภาษี", "ทิป %", "ภาษี %", "คน", "กระจายเศษจากการปัด",
    "ภาษี", "ทิป", "รวม", "ส่วนของแต่ละคน", "บันทึกการหาร",
    "เวลาอ่าน", "วางหรือพิมพ์ข้อความเพื่อดูโปรไฟล์การอ่านทันที", "ไม่มีช่องว่าง",
    "รวม แยก ย่อ และทำเครื่องหมาย PDF",
    "{count, plural, other {สร้าง PDF จาก # ภาพ}}",
))
MORE["vi"] = pack_generic((
    "Số nguyên", "Thập phân", "Boolean", "Chọn", "Mật khẩu", "Tối thiểu", "Tối đa", "Độ chính xác",
    "Lựa chọn, mỗi dòng một", "Độ dài mật khẩu", "Sao chép kết quả", "Kết quả gần đây",
    "Tạm tính", "Tip %", "Thuế %", "Người", "Phân phần dư làm tròn",
    "Thuế", "Tip", "Tổng", "Phần từng người", "Lưu chia tiền",
    "Thời gian đọc", "Dán hoặc gõ chữ để xem hồ sơ đọc tức thì.", "Không khoảng trắng",
    "Gộp, tách, thu nhỏ và đánh dấu PDF",
    "{count, plural, other {Đã tạo PDF từ # ảnh.}}",
))
MORE["es"] = COMMON_CHROME["es"]

for loc, extra in MORE.items():
    COPY.setdefault(loc, {}).update(extra)

# Force nl stopwatch away from English where we left "Stopwatch"/"Start"
COPY["nl"]["tools.stopwatch-timer.stopwatch"] = "Stopwatch"
COPY["nl"]["tools.stopwatch-timer.start"] = "Starten"
COPY["id"]["tools.stopwatch-timer.stopwatch"] = "Stopwatch"
COPY.setdefault("id", {})
COPY["id"]["tools.stopwatch-timer.stopwatch"] = "Penghitung waktu"


def get_path(obj: dict, path: str):
    cur = obj
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return None
        cur = cur[part]
    return cur


def main() -> None:
    en_paths = {path: get_path(EN, path) for locale_map in COPY.values() for path in locale_map}
    updated = 0
    for locale, mapping in COPY.items():
        path = MESSAGES / f"{locale}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        for dotted, value in mapping.items():
            current = get_path(data, dotted)
            english = get_path(EN, dotted)
            if dotted.endswith("pdfDesc") or dotted.endswith("success") or current is None or current == english:
                set_path(data, dotted, value)
                updated += 1
            elif current == value:
                continue
            else:
                # already translated uniquely; still overwrite minutes/seconds/stopwatch chrome if English leftovers
                if dotted.split(".")[-1] in {
                    "minutes", "seconds", "stopwatch", "countdown", "pause", "finished", "start", "recordTime",
                    "integer", "decimal", "boolean", "pick", "password", "minimum", "maximum", "placeholder",
                    "readTime", "noSpaces", "search", "searchAria",
                } and current == english:
                    set_path(data, dotted, value)
                    updated += 1
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    zh = json.loads((MESSAGES / "zh-Hans.json").read_text(encoding="utf-8"))
    (MESSAGES / "zh.json").write_text(json.dumps(zh, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote chrome copy, touches≈{updated}")


if __name__ == "__main__":
    main()
