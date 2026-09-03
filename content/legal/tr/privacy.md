# Gizlilik Politikası

**Son güncelleme:** 15 Temmuz 2026

Bu politika, statik bir web sitesi olarak yayımlanan ve tarayıcınızda çalışmak üzere tasarlanan bir yardımcı araçlar koleksiyonu olan **Kit**'i kullandığınızda bilgilerin nasıl işlendiğini açıklar.

## Temel fikir

Kit, **dosyalarınızla ilgili çalışmaların cihazınızda yapılması** için tasarlanmıştır. Araçlarda açtığınız belgelerin, görsellerin veya medyanın içeriğini alan, depolayan ya da analiz eden bir uygulama sunucusu işletmiyoruz.

## Kit ne yapmaz

Araçları kullandığınızda (örneğin PDF'leri birleştirirken veya görselleri sıkıştırırken):

- Dosyalarınız işlenmek üzere bir Kit arka ucuna **yüklenmez**.
- **Kullanıcı hesabı oluşturmayız.**
- **Kişisel verileri satmayız.**
- **Reklam SDK'ları veya reklam amacıyla siteler arası izleme kullanmayız.**

## Hizmetin çevresinde bulunabilecek bilgiler

### 1. Cihazınızda kalan veriler

Tarayıcınız aşağıdakiler gibi sınırlı bilgileri yerel olarak saklayabilir:

- Görünüm tercihleri (açık, koyu veya sistem)
- Seçilen dil
- Favoriler veya sabitlenmiş araçlar
- **Geçmiş özetleri** (kullanılan araç, yaklaşık zaman, kısa açıklama) — dosyalarınızın içeriği **değil**
- Kaydetmeyi seçtiğiniz hazır ayarlar

Geçmişi Ayarlar'dan temizleyebilir veya tarayıcınızda bu sitenin verilerini silebilirsiniz.

### 2. Ağ ve barındırma günlükleri

Kit genellikle **Cloudflare Pages** üzerinde statik dosyalar olarak barındırılır (kanonik site: trykit.pages.dev) ve GitHub Pages yedeği vardır. Tarayıcınız sayfa ve varlık istediğinde barındırma hizmeti; IP adresi, kullanıcı aracısı, zaman damgaları ve istenen URL'ler gibi standart teknik verileri otomatik olarak günlüğe kaydedebilir. Bu günlükler Kit'in belgelerinizi açan bir sunucusu tarafından değil, barındırıcının altyapısı ve politikaları tarafından kontrol edilir.

### 3. İsteğe bağlı üçüncü taraf kaynakları

PDF araçları pdf.js worker'ını, yazı tiplerini ve ilgili dosyaları **bu siteden** yükler (uygulamayla birlikte gelir). Ses ve video araçları bir FFmpeg WebAssembly motorunu **bu siteden** yükler. Dosya içerikleriniz tarayıcıda kalır; bu kitaplıklar uygulama kodudur, belgelerinizi gönderdiğimiz bir yer değildir.

FFmpeg motoru (`@ffmpeg/core`) H.264 ve LAME MP3 gibi kodlayıcılar içerdiği için **GPL-2.0-or-later** lisanslıdır. Kit’in kendi kaynağı MIT kalır. pdf.js ve diğer kitaplıklar Apache, BSD veya MIT lisanslarını korur.

### 4. Para birimi kurları

Para birimi kurlarını yenilediğinizde bu tarayıcı Frankfurter’ın herkese açık API’sine sorgu gönderir. İstek, IP adresi, user agent, zaman ve istenen URL gibi standart ağ meta verilerini Frankfurter ile paylaşabilir. Kurlar bu tarayıcının önbelleğinden gelebilir ve güncelliğini yitirmiş olabilir. Bunlar yalnızca günlük referans verileridir; alım satım, muhasebe, vergi veya takas için garanti değildir. Dönüştürücüyü açmak veya para birimi değiştirmek, taze önbellek yoksa kur da isteyebilir. Yazdığınız tutarlar gönderilmez.

## Aşamalı Web Uygulaması (PWA)

Kit'i yüklerseniz veya çevrimdışı kullanıma izin verirseniz bir service worker **uygulama kabuğunu** (sayfalar, komut dosyaları, stiller, simgeler) önbelleğe alabilir. Kit, kişisel dosyalarınızı bu önbellekte saklamak üzere tasarlanmamıştır.

## Çocuklar

Kit genel amaçlı bir yardımcı araçtır. 13 yaşın altındaki çocuklara yönelik değildir ve Kit hesap sunmadığından, bir kayıt sistemi aracılığıyla çocukların kişisel bilgilerini bilerek toplamıyoruz.

## Değişiklikler

Ürün veya yasal gereklilikler değiştiğinde bu politikayı güncelleyebiliriz. Bunu yaptığımızda “Son güncelleme” tarihini değiştiririz. Bir güncellemeden sonra Kit'i kullanmaya devam etmeniz, gözden geçirilmiş politikayı incelediğiniz anlamına gelir.

## İletişim

Gizlilik soruları: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

**Tim G (GitHub: TGthms)** tarafından yayımlanmıştır.
