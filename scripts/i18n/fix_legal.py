#!/usr/bin/env python3
"""Refresh privacy/terms hosting + engine wording for every locale."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEGAL = ROOT / "content" / "legal"

HOSTING = {
    "en": "Kit is typically hosted as static files on **Cloudflare Pages** (canonical site: trykit.pages.dev), with a GitHub Pages backup. When your browser requests pages and assets, the host may automatically log standard technical data such as IP address, user agent, timestamps, and requested URLs. That logging is controlled by the host’s infrastructure and policies—not by a Kit server that opens your documents.",
    "es": "Kit suele servirse como archivos estáticos en **Cloudflare Pages** (sitio canónico: trykit.pages.dev), con una copia de seguridad en GitHub Pages. Cuando tu navegador pide páginas o recursos, el anfitrión puede registrar datos técnicos habituales: dirección IP, agente de usuario, hora y URL solicitada. Ese registro depende de la infraestructura del anfitrión, no de un servidor de Kit que abra tus documentos.",
    "fr": "Kit est généralement hébergé sous forme de fichiers statiques sur **Cloudflare Pages** (site canonique : trykit.pages.dev), avec une copie de secours sur GitHub Pages. Lorsque votre navigateur demande des pages et des ressources, l'hébergeur peut enregistrer des données techniques standard telles que l'adresse IP, l'agent utilisateur, les horodatages et les URL demandées. Ces journaux sont régis par l'infrastructure et les politiques de l'hébergeur, et non par un serveur Kit qui ouvre vos documents.",
    "de": "Kit wird in der Regel als statische Dateien auf **Cloudflare Pages** gehostet (kanonische Seite: trykit.pages.dev), mit einer GitHub-Pages-Sicherung. Wenn Ihr Browser Seiten und Ressourcen anfordert, kann der Hoster technische Standarddaten wie IP-Adresse, User-Agent, Zeitstempel und angeforderte URLs protokollieren. Diese Protokollierung wird durch die Infrastruktur und Richtlinien des Hosters gesteuert — nicht durch einen Kit-Server, der Ihre Dokumente öffnet.",
    "ja": "Kit は通常、**Cloudflare Pages**（正規サイト: trykit.pages.dev）上の静的ファイルとして公開され、GitHub Pages にバックアップがあります。ページやアセットを取得する際、ホスティング事業者は IP アドレス、ユーザーエージェント、タイムスタンプ、リクエスト URL などの標準的な技術データを記録する場合があります。これは文書を処理する Kit サーバーではなく、ホスティング基盤の運用に起因します。",
    "zh-Hans": "Kit 通常以静态文件形式托管在 **Cloudflare Pages**（规范站点：trykit.pages.dev），并以 GitHub Pages 作为备份。当你的浏览器请求页面或资源时，托管方可能会记录常规技术信息：IP 地址、用户代理、时间戳与请求 URL。此类日志由托管基础设施及其政策决定，**并非 Kit 在服务器端打开你的文档。**",
    "zh-Hant": "Kit 通常以靜態檔案形式託管於 **Cloudflare Pages**（正式網站：trykit.pages.dev），並以 GitHub Pages 作為備份。當你的瀏覽器請求頁面或資源時，託管方可能會記錄一般技術資訊：IP 位址、使用者代理程式、時間戳記與請求 URL。此類記錄由託管基礎設施及其政策決定，**並非 Kit 在伺服器端開啟你的文件。**",
    "ar": "يُستضاف Kit عادةً كملفات ثابتة على **Cloudflare Pages** (الموقع الأساسي: trykit.pages.dev)، مع نسخة احتياطية على GitHub Pages. عندما يطلب متصفحك الصفحات والموارد، قد يسجل المضيف تلقائياً بيانات تقنية قياسية مثل عنوان IP ووكيل المستخدم والطوابع الزمنية وعناوين URL المطلوبة. يتحكم في هذا التسجيل نظام المضيف وسياساته، وليس خادم Kit الذي يفتح مستنداتك.",
    "ko": "Kit은 일반적으로 **Cloudflare Pages**(공식 사이트: trykit.pages.dev)에 정적 파일로 호스팅되며 GitHub Pages 백업이 있습니다. 브라우저가 페이지와 리소스를 요청하면 호스트가 IP 주소, 사용자 에이전트, 타임스탬프, 요청 URL과 같은 표준 기술 데이터를 자동으로 기록할 수 있습니다. 이러한 기록은 호스트의 인프라와 정책에 의해 관리되며, 문서를 여는 Kit 서버에 의해 관리되는 것이 아닙니다.",
}

LIBS = {
    "en": "PDF tools load the pdf.js worker, fonts, and related assets from **this same site** (vendored with the app). Audio and video tools load an FFmpeg WebAssembly engine from **this same site**. Your file contents stay in the browser; those libraries are application code, not a place we send your documents.",
    "es": "Las herramientas PDF cargan el worker de pdf.js, las fuentes y los recursos relacionados **desde este mismo sitio** (van incluidos en la app). Las herramientas de audio y vídeo cargan un motor FFmpeg WebAssembly **desde este mismo sitio**. El contenido de tus archivos permanece en el navegador; esas bibliotecas son código de la aplicación, no un destino al que enviemos tus documentos.",
    "fr": "Les outils PDF chargent le worker pdf.js, les polices et les ressources associées **depuis ce même site** (fournis avec l’application). Les outils audio et vidéo chargent un moteur FFmpeg WebAssembly **depuis ce même site**. Le contenu de vos fichiers reste dans le navigateur ; ces bibliothèques sont du code applicatif, pas un endroit où nous envoyons vos documents.",
    "de": "PDF-Werkzeuge laden den pdf.js-Worker, Schriften und zugehörige Dateien **von dieser Website** (mit der App ausgeliefert). Audio- und Videowerkzeuge laden eine FFmpeg-WebAssembly-Engine **von dieser Website**. Ihre Dateiinhalte bleiben im Browser; diese Bibliotheken sind Anwendungscode, kein Ort, an den wir Ihre Dokumente senden.",
    "ja": "PDF ツールは pdf.js のワーカー、フォント、関連資産を **このサイト自身** から読み込みます（アプリに同梱）。音声・動画ツールは FFmpeg WebAssembly エンジンを **このサイト自身** から読み込みます。ファイル内容はブラウザ内に留まり、これらのライブラリはアプリのコードであり、文書の送信先ではありません。",
    "zh-Hans": "PDF 工具从**本站**加载 pdf.js worker、字体和相关资源（随应用一并提供）。音频和视频工具从**本站**加载 FFmpeg WebAssembly 引擎。你的文件内容留在浏览器中；这些库是应用程序代码，不是我们接收文档的地方。",
    "zh-Hant": "PDF 工具從**本站**載入 pdf.js worker、字型與相關資源（隨應用一併提供）。音訊與視訊工具從**本站**載入 FFmpeg WebAssembly 引擎。你的檔案內容留在瀏覽器中；這些函式庫是應用程式碼，不是我們接收文件的地方。",
    "ar": "تحمّل أدوات PDF عامل pdf.js والخطوط والموارد ذات الصلة **من هذا الموقع نفسه** (مرفقة مع التطبيق). وتحمّل أدوات الصوت والفيديو محرك FFmpeg WebAssembly **من هذا الموقع نفسه**. يبقى محتوى ملفاتك في المتصفح؛ هذه المكتبات شيفرة التطبيق، وليست مكاناً نرسل إليه مستنداتك.",
    "ko": "PDF 도구는 pdf.js 워커, 글꼴 및 관련 자산을 **이 사이트에서** 불러옵니다(앱에 포함). 오디오·비디오 도구는 FFmpeg WebAssembly 엔진을 **이 사이트에서** 불러옵니다. 파일 내용은 브라우저에 남으며, 해당 라이브러리는 애플리케이션 코드이지 문서를 보내는 곳이 아닙니다.",
}

# Remaining locales reuse English structure with a short native sentence.
FALLBACK_HOST = HOSTING["en"]
FALLBACK_LIBS = LIBS["en"]

MORE_HOST = {
    "it": "Kit è generalmente ospitato come file statici su **Cloudflare Pages** (sito canonico: trykit.pages.dev), con una copia di riserva su GitHub Pages. Quando il browser richiede pagine e risorse, il provider di hosting può registrare dati tecnici standard come indirizzo IP, user agent, timestamp e URL richiesti. Questa registrazione è regolata dall'infrastruttura e dalle politiche del provider, non da un server Kit che apre i tuoi documenti.",
    "pt-BR": "O Kit normalmente é hospedado como arquivos estáticos no **Cloudflare Pages** (site canônico: trykit.pages.dev), com uma cópia no GitHub Pages. Quando seu navegador solicita páginas e recursos, o provedor de hospedagem pode registrar dados técnicos padrão, como endereço IP, agente do usuário, carimbos de data e hora e URLs solicitadas. Esse registro é controlado pela infraestrutura e pelas políticas do provedor, não por um servidor do Kit que abre seus documentos.",
    "pt-PT": "O Kit é normalmente alojado como ficheiros estáticos no **Cloudflare Pages** (sítio canónico: trykit.pages.dev), com uma cópia no GitHub Pages. Quando o seu navegador solicita páginas e recursos, o fornecedor de alojamento pode registar dados técnicos padrão, como endereço IP, agente do utilizador, carimbos de data e hora e URLs solicitados. Esse registo é controlado pela infraestrutura e pelas políticas do fornecedor, não por um servidor do Kit que abra os seus documentos.",
    "nl": "Kit wordt doorgaans gehost als statische bestanden op **Cloudflare Pages** (canonieke site: trykit.pages.dev), met een GitHub Pages-back-up. Wanneer je browser pagina's en assets opvraagt, kan de hostingprovider standaard technische gegevens loggen, zoals IP-adres, user-agent, tijdstempels en opgevraagde URL's. Die logging wordt beheerd door de infrastructuur en het beleid van de host — niet door een Kit-server die je documenten opent.",
    "nb": "Kit hostes vanligvis som statiske filer på **Cloudflare Pages** (kanonisk nettsted: trykit.pages.dev), med en GitHub Pages-sikkerhetskopi. Når nettleseren din ber om sider og ressurser, kan verten automatisk logge standard tekniske data som IP-adresse, brukeragent, tidsstempler og forespurte URL-er. Denne loggføringen styres av vertens infrastruktur og retningslinjer — ikke av en Kit-server som åpner dokumentene dine.",
    "ru": "Kit обычно размещается в виде статических файлов на **Cloudflare Pages** (канонический сайт: trykit.pages.dev) с резервной копией на GitHub Pages. Когда браузер запрашивает страницы и ресурсы, хостинг-провайдер может автоматически записывать стандартные технические данные, такие как IP-адрес, user agent, временные метки и запрошенные URL. Такая запись контролируется инфраструктурой и правилами хостинга, а не сервером Kit, который открывает ваши документы.",
    "he": "Kit מתארח בדרך כלל כקבצים סטטיים ב־**Cloudflare Pages** (האתר הקנוני: trykit.pages.dev), עם גיבוי ב־GitHub Pages. כאשר הדפדפן שלך מבקש דפים ומשאבים, ספק האירוח עשוי לתעד באופן אוטומטי נתונים טכניים רגילים כגון כתובת IP, סוכן משתמש, חותמות זמן וכתובות URL שהתבקשו. תיעוד זה נשלט על ידי התשתית והמדיניות של המארח, ולא על ידי שרת Kit שפותח את המסמכים שלך.",
}

MORE_LIBS = {
    "it": "Gli strumenti PDF caricano il worker pdf.js, i font e le risorse collegate **da questo stesso sito** (inclusi nell’app). Gli strumenti audio e video caricano un motore FFmpeg WebAssembly **da questo stesso sito**. Il contenuto dei file resta nel browser; queste librerie sono codice dell’applicazione, non un luogo a cui inviamo i tuoi documenti.",
    "pt-BR": "As ferramentas de PDF carregam o worker do pdf.js, as fontes e os recursos relacionados **deste mesmo site** (incluídos no app). As ferramentas de áudio e vídeo carregam um mecanismo FFmpeg WebAssembly **deste mesmo site**. O conteúdo dos seus arquivos permanece no navegador; essas bibliotecas são código do aplicativo, não um destino para o qual enviamos seus documentos.",
    "pt-PT": "As ferramentas de PDF carregam o worker do pdf.js, os tipos de letra e os recursos relacionados **deste mesmo sítio** (incluídos na app). As ferramentas de áudio e vídeo carregam um motor FFmpeg WebAssembly **deste mesmo sítio**. O conteúdo dos seus ficheiros permanece no navegador; essas bibliotecas são código da aplicação, não um destino para o qual enviamos os seus documentos.",
    "nl": "PDF-tools laden de pdf.js-worker, lettertypen en bijbehorende bestanden **vanaf deze site** (meegeleverd met de app). Audio- en videotools laden een FFmpeg-WebAssembly-engine **vanaf deze site**. Je bestanden blijven in de browser; die bibliotheken zijn applicatiecode, geen plek waar we je documenten naartoe sturen.",
    "nb": "PDF-verktøy laster pdf.js-workeren, skrifter og relaterte filer **fra dette nettstedet** (levert med appen). Lyd- og videoverktøy laster en FFmpeg WebAssembly-motor **fra dette nettstedet**. Filinnholdet blir i nettleseren; bibliotekene er programkode, ikke et sted vi sender dokumentene dine.",
    "ru": "Инструменты PDF загружают worker pdf.js, шрифты и связанные ресурсы **с этого же сайта** (поставляются с приложением). Аудио- и видеоинструменты загружают движок FFmpeg WebAssembly **с этого же сайта**. Содержимое файлов остаётся в браузере; эти библиотеки — код приложения, а не место, куда мы отправляем ваши документы.",
    "he": "כלי ה־PDF טוענים את ה־worker של pdf.js, גופנים ומשאבים קשורים **מאותו אתר** (מצורפים ליישום). כלי שמע ווידאו טוענים מנוע FFmpeg WebAssembly **מאותו אתר**. תוכן הקבצים נשאר בדפדפן; הספריות האלה הן קוד היישום, לא יעד שאליו אנו שולחים את המסמכים שלך.",
}

HOSTING.update(MORE_HOST)
LIBS.update(MORE_LIBS)
HOSTING.update({
    "cs": "Kit je obvykle hostován jako statické soubory na **Cloudflare Pages** (kanonický web: trykit.pages.dev) se zálohou na GitHub Pages. Když prohlížeč požaduje stránky a zdroje, může poskytovatel hostingu zaznamenávat standardní technické údaje, jako je IP adresa, user agent, časová razítka a požadované adresy URL. Toto zaznamenávání se řídí infrastrukturou a zásadami hostitele — nikoli serverem Kit, který by otevíral vaše dokumenty.",
    "da": "Kit hostes typisk som statiske filer på **Cloudflare Pages** (kanonisk site: trykit.pages.dev) med en GitHub Pages-sikkerhedskopi. Når din browser anmoder om sider og ressourcer, kan hosten automatisk logge standardtekniske data som IP-adresse, user agent, tidsstempler og anmodede URL'er. Denne logning styres af hostens infrastruktur og politikker — ikke af en Kit-server, der åbner dine dokumenter.",
    "el": "Το Kit συνήθως φιλοξενείται ως στατικά αρχεία στο **Cloudflare Pages** (κανονικός ιστότοπος: trykit.pages.dev), με αντίγραφο ασφαλείας στο GitHub Pages. Όταν το πρόγραμμα περιήγησής σας ζητά σελίδες και πόρους, ο πάροχος φιλοξενίας μπορεί να καταγράφει αυτόματα τυπικά τεχνικά δεδομένα, όπως διεύθυνση IP, user agent, χρονικές σημάνσεις και τα URL που ζητήθηκαν. Η καταγραφή ελέγχεται από την υποδομή και τις πολιτικές του παρόχου φιλοξενίας, όχι από διακομιστή του Kit που ανοίγει τα έγγραφά σας.",
    "fi": "Kit isännöidään yleensä staattisina tiedostoina **Cloudflare Pages** -palvelussa (kanoninen sivusto: trykit.pages.dev), GitHub Pages -varmuuskopion kera. Kun selaimesi pyytää sivuja ja resursseja, isännöintipalveluntarjoaja voi kirjata tavanomaisia teknisiä tietoja, kuten IP-osoitteen, käyttäjäagentin, aikaleimat ja pyydetyt URL-osoitteet. Kirjaamista hallitsevat isännän infrastruktuuri ja käytännöt — ei Kit-palvelin, joka avaisi asiakirjojasi.",
    "hi": "Kit आमतौर पर **Cloudflare Pages** (आधिकारिक साइट: trykit.pages.dev) पर स्थिर फ़ाइलों के रूप में होस्ट किया जाता है, GitHub Pages पर बैकअप के साथ। जब आपका ब्राउज़र पेज और संसाधन माँगता है, तो होस्ट मानक तकनीकी डेटा जैसे IP पता, उपयोगकर्ता एजेंट, टाइमस्टैम्प और अनुरोधित URL को अपने-आप लॉग कर सकता है। यह लॉगिंग होस्ट के बुनियादी ढाँचे और नीतियों द्वारा नियंत्रित होती है — यह किसी ऐसे Kit सर्वर द्वारा नहीं की जाती जो आपके दस्तावेज़ खोलता हो।",
    "hu": "A Kitet általában statikus fájlként a **Cloudflare Pagesen** tárolják (hivatalos oldal: trykit.pages.dev), GitHub Pages-mentéssel. Amikor a böngészője oldalakat és erőforrásokat kér, a tárhelyszolgáltató automatikusan naplózhat szabványos technikai adatokat, például IP-címet, felhasználói ügynököt, időbélyegeket és a kért URL-eket. Ezt a naplózást a tárhelyszolgáltató infrastruktúrája és szabályzatai vezérlik, nem pedig egy, a dokumentumait megnyitó Kit-szerver.",
    "id": "Kit biasanya di-host sebagai file statis di **Cloudflare Pages** (situs kanonis: trykit.pages.dev), dengan cadangan GitHub Pages. Saat browser Anda meminta halaman dan aset, host dapat secara otomatis mencatat data teknis standar seperti alamat IP, user agent, stempel waktu, dan URL yang diminta. Pencatatan tersebut dikendalikan oleh infrastruktur dan kebijakan host — bukan oleh server Kit yang membuka dokumen Anda.",
    "pl": "Kit jest zwykle hostowany jako pliki statyczne na **Cloudflare Pages** (kanoniczna strona: trykit.pages.dev), z kopią na GitHub Pages. Gdy przeglądarka żąda stron i zasobów, dostawca hostingu może automatycznie rejestrować standardowe dane techniczne, takie jak adres IP, agent użytkownika, znaczniki czasu i żądane adresy URL. Rejestrowanie jest kontrolowane przez infrastrukturę i zasady hosta, a nie przez serwer Kit otwierający Twoje dokumenty.",
    "ro": "Kit este găzduit de obicei ca fișiere statice pe **Cloudflare Pages** (site canonic: trykit.pages.dev), cu o copie pe GitHub Pages. Când browserul solicită pagini și resurse, gazda poate înregistra automat date tehnice standard, precum adresa IP, agentul utilizatorului, marcaje temporale și URL-urile solicitate. Înregistrarea este controlată de infrastructura și politicile gazdei, nu de un server Kit care deschide documentele dumneavoastră.",
    "sv": "Kit hostas vanligtvis som statiska filer på **Cloudflare Pages** (kanonisk sajt: trykit.pages.dev), med en GitHub Pages-säkerhetskopia. När din webbläsare begär sidor och resurser kan värden automatiskt logga tekniska standarduppgifter som IP-adress, user agent, tidsstämplar och begärda URL:er. Den loggningen styrs av värdens infrastruktur och policyer — inte av en Kit-server som öppnar dina dokument.",
    "th": "โดยทั่วไป Kit โฮสต์เป็นไฟล์แบบสแตติกบน **Cloudflare Pages** (ไซต์หลัก: trykit.pages.dev) และมี GitHub Pages เป็นสำรอง เมื่อเบราว์เซอร์ของคุณร้องขอหน้าและทรัพยากร ผู้ให้บริการโฮสติ้งอาจบันทึกข้อมูลทางเทคนิคมาตรฐานโดยอัตโนมัติ เช่น ที่อยู่ IP user agent การประทับเวลา และ URL ที่ร้องขอ การบันทึกดังกล่าวอยู่ภายใต้โครงสร้างพื้นฐานและนโยบายของโฮสต์ ไม่ใช่เซิร์ฟเวอร์ของ Kit ที่เปิดเอกสารของคุณ",
    "tr": "Kit genellikle **Cloudflare Pages** üzerinde statik dosyalar olarak barındırılır (kanonik site: trykit.pages.dev) ve GitHub Pages yedeği vardır. Tarayıcınız sayfa ve varlık istediğinde barındırma hizmeti; IP adresi, kullanıcı aracısı, zaman damgaları ve istenen URL'ler gibi standart teknik verileri otomatik olarak günlüğe kaydedebilir. Bu günlükler Kit'in belgelerinizi açan bir sunucusu tarafından değil, barındırıcının altyapısı ve politikaları tarafından kontrol edilir.",
    "uk": "Kit зазвичай розміщується як статичні файли на **Cloudflare Pages** (канонічний сайт: trykit.pages.dev) із резервною копією на GitHub Pages. Коли браузер запитує сторінки та ресурси, хостинг-провайдер може автоматично записувати стандартні технічні дані, як-от IP-адресу, user agent, часові позначки та запитані URL. Це записування контролюється інфраструктурою та політиками хостингу, а не сервером Kit, який відкриває ваші документи.",
    "vi": "Kit thường được lưu trữ dưới dạng các tệp tĩnh trên **Cloudflare Pages** (trang chuẩn: trykit.pages.dev), với bản sao trên GitHub Pages. Khi trình duyệt yêu cầu các trang và tài nguyên, nhà cung cấp dịch vụ lưu trữ có thể tự động ghi lại dữ liệu kỹ thuật tiêu chuẩn như địa chỉ IP, user agent, dấu thời gian và URL được yêu cầu. Việc ghi nhật ký này do cơ sở hạ tầng và chính sách của nhà lưu trữ kiểm soát — không phải do máy chủ Kit mở tài liệu của bạn.",
})
LIBS.update({
    "cs": "Nástroje PDF načítají worker pdf.js, písma a související soubory **z tohoto webu** (jsou součástí aplikace). Nástroje pro audio a video načítají engine FFmpeg WebAssembly **z tohoto webu**. Obsah souborů zůstává v prohlížeči; tyto knihovny jsou kódem aplikace, nikoli místem, kam posíláme vaše dokumenty.",
    "da": "PDF-værktøjer indlæser pdf.js-workeren, fonte og relaterede filer **fra dette site** (følger med appen). Lyd- og videoværktøjer indlæser en FFmpeg WebAssembly-motor **fra dette site**. Dine filer bliver i browseren; bibliotekerne er programkode, ikke et sted vi sender dine dokumenter hen.",
    "el": "Τα εργαλεία PDF φορτώνουν τον worker του pdf.js, τις γραμματοσειρές και τα σχετικά αρχεία **από αυτόν τον ιστότοπο** (περιλαμβάνονται στην εφαρμογή). Τα εργαλεία ήχου και βίντεο φορτώνουν μια μηχανή FFmpeg WebAssembly **από αυτόν τον ιστότοπο**. Το περιεχόμενο των αρχείων μένει στο πρόγραμμα περιήγησης· αυτές οι βιβλιοθήκες είναι κώδικας της εφαρμογής, όχι προορισμός στον οποίο στέλνουμε τα έγγραφά σας.",
    "fi": "PDF-työkalut lataavat pdf.js-työntekijän, fontit ja liittyvät tiedostot **tältä sivustolta** (toimitetaan sovelluksen mukana). Ääni- ja videotyökalut lataavat FFmpeg WebAssembly -moottorin **tältä sivustolta**. Tiedostojesi sisältö pysyy selaimessa; kirjastot ovat sovelluskoodia, eivät paikka johon lähetämme asiakirjasi.",
    "hi": "PDF उपकरण pdf.js वर्कर, फ़ॉन्ट और संबंधित फ़ाइलें **इसी साइट से** लोड करते हैं (ऐप के साथ bundled)। ऑडियो और वीडियो उपकरण FFmpeg WebAssembly इंजन **इसी साइट से** लोड करते हैं। आपकी फ़ाइलों की सामग्री ब्राउज़र में रहती है; ये लाइब्रेरी ऐप का कोड हैं, आपके दस्तावेज़ भेजने की जगह नहीं।",
    "hu": "A PDF-eszközök a pdf.js workert, a betűkészleteket és a kapcsolódó fájlokat **erről a webhelyről** töltik be (az alkalmazással együtt járnak). A hang- és videóeszközök egy FFmpeg WebAssembly-motort töltenek be **erről a webhelyről**. A fájlok tartalma a böngészőben marad; ezek a könyvtárak alkalmazáskód, nem olyan hely, ahová a dokumentumait küldenénk.",
    "id": "Alat PDF memuat worker pdf.js, font, dan aset terkait **dari situs ini** (disertakan dengan aplikasi). Alat audio dan video memuat mesin FFmpeg WebAssembly **dari situs ini**. Isi file Anda tetap di browser; pustaka itu adalah kode aplikasi, bukan tempat kami mengirim dokumen Anda.",
    "pl": "Narzędzia PDF ładują worker pdf.js, czcionki i powiązane pliki **z tej witryny** (dołączone do aplikacji). Narzędzia audio i wideo ładują silnik FFmpeg WebAssembly **z tej witryny**. Zawartość plików zostaje w przeglądarce; te biblioteki to kod aplikacji, nie miejsce, do którego wysyłamy Twoje dokumenty.",
    "ro": "Instrumentele PDF încarcă worker-ul pdf.js, fonturile și resursele asociate **de pe acest site** (incluse în aplicație). Instrumentele audio și video încarcă un motor FFmpeg WebAssembly **de pe acest site**. Conținutul fișierelor rămâne în browser; aceste biblioteci sunt codul aplicației, nu un loc unde trimitem documentele dumneavoastră.",
    "sv": "PDF-verktyg läser in pdf.js-workern, typsnitt och relaterade filer **från den här sajten** (följer med appen). Ljud- och videoverktyg läser in en FFmpeg WebAssembly-motor **från den här sajten**. Filinnehållet stannar i webbläsaren; biblioteken är programkod, inte en plats dit vi skickar dina dokument.",
    "th": "เครื่องมือ PDF โหลด pdf.js worker ฟอนต์ และไฟล์ที่เกี่ยวข้อง **จากไซต์นี้** (มาพร้อมแอป) เครื่องมือเสียงและวิดีโอโหลดเอนจิน FFmpeg WebAssembly **จากไซต์นี้** เนื้อหาไฟล์ของคุณอยู่ในเบราว์เซอร์ ไลบรารีเหล่านี้เป็นโค้ดของแอป ไม่ใช่ที่ที่เราส่งเอกสารไป",
    "tr": "PDF araçları pdf.js worker'ını, yazı tiplerini ve ilgili dosyaları **bu siteden** yükler (uygulamayla birlikte gelir). Ses ve video araçları bir FFmpeg WebAssembly motorunu **bu siteden** yükler. Dosya içerikleriniz tarayıcıda kalır; bu kitaplıklar uygulama kodudur, belgelerinizi gönderdiğimiz bir yer değildir.",
    "uk": "Інструменти PDF завантажують worker pdf.js, шрифти та пов’язані файли **з цього сайту** (постачаються з додатком). Аудіо- та відеоінструменти завантажують рушій FFmpeg WebAssembly **з цього сайту**. Вміст файлів залишається в браузері; ці бібліотеки — код програми, а не місце, куди ми надсилаємо ваші документи.",
    "vi": "Công cụ PDF tải worker pdf.js, phông chữ và tài nguyên liên quan **từ chính trang này** (đi kèm ứng dụng). Công cụ âm thanh và video tải một engine FFmpeg WebAssembly **từ chính trang này**. Nội dung tệp của bạn ở lại trong trình duyệt; các thư viện đó là mã ứng dụng, không phải nơi chúng tôi gửi tài liệu của bạn.",
})


def replace_paragraph(text: str, marker: str, replacement: str) -> str:
    lines = text.splitlines(keepends=True)
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith(marker):
            out.append(line)
            i += 1
            if i < len(lines) and lines[i].strip() == "":
                out.append(lines[i])
                i += 1
            para = []
            while i < len(lines) and lines[i].strip() and not lines[i].startswith("#"):
                para.append(lines[i])
                i += 1
            out.append(replacement.rstrip() + "\n")
            continue
        out.append(line)
        i += 1
    return "".join(out)


def bump_date(text: str) -> str:
    for old in ("July 15, 2026", "15 July 2026", "15 de julio de 2026", "15 juillet 2026"):
        text = text.replace(old, "September 1, 2026")
    return text


def main() -> None:
    for folder in sorted(LEGAL.iterdir()):
        if not folder.is_dir():
            continue
        loc = folder.name
        privacy = folder / "privacy.md"
        terms = folder / "terms.md"
        if privacy.exists():
            text = privacy.read_text(encoding="utf-8")
            host = HOSTING.get(loc, FALLBACK_HOST)
            libs = LIBS.get(loc, FALLBACK_LIBS)
            text = replace_paragraph(text, "### 2.", host)
            text = replace_paragraph(text, "### 3.", libs)
            text = bump_date(text)
            privacy.write_text(text, encoding="utf-8")
            print(f"updated {privacy.relative_to(ROOT)}")
        if terms.exists():
            text = bump_date(terms.read_text(encoding="utf-8"))
            terms.write_text(text, encoding="utf-8")

    hans = (LEGAL / "zh-Hans" / "privacy.md").read_text(encoding="utf-8")
    (LEGAL / "zh" / "privacy.md").write_text(hans, encoding="utf-8")
    print("updated content/legal/zh/privacy.md")


if __name__ == "__main__":
    main()
