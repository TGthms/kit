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

Kit genellikle statik dosyalar olarak barındırılır (örneğin GitHub Pages'te). Tarayıcınız sayfa ve varlık istediğinde barındırma hizmeti; IP adresi, kullanıcı aracısı, zaman damgaları ve istenen URL'ler gibi standart teknik verileri otomatik olarak günlüğe kaydedebilir. Bu günlükler Kit'in belgelerinizi açan bir sunucusu tarafından değil, barındırıcının altyapısı ve politikaları tarafından kontrol edilir.

### 3. İsteğe bağlı üçüncü taraf kaynakları

Bazı gelişmiş özellikler, onları ilk kez kullandığınızda içerik dağıtım ağlarından işleme kitaplıkları (örneğin FFmpeg WebAssembly çekirdekleri veya PDF worker komut dosyaları) yükleyebilir. Bu istekler CDN'ye standart ağ meta verilerini gösterebilir. Dosya içerikleriniz tarayıcıda işlenmeye devam eder; CDN belgelerinizi değil, kodu sunar.

## Aşamalı Web Uygulaması (PWA)

Kit'i yüklerseniz veya çevrimdışı kullanıma izin verirseniz bir service worker **uygulama kabuğunu** (sayfalar, komut dosyaları, stiller, simgeler) önbelleğe alabilir. Kit, kişisel dosyalarınızı bu önbellekte saklamak üzere tasarlanmamıştır.

## Çocuklar

Kit genel amaçlı bir yardımcı araçtır. 13 yaşın altındaki çocuklara yönelik değildir ve Kit hesap sunmadığından, bir kayıt sistemi aracılığıyla çocukların kişisel bilgilerini bilerek toplamıyoruz.

## Değişiklikler

Ürün veya yasal gereklilikler değiştiğinde bu politikayı güncelleyebiliriz. Bunu yaptığımızda “Son güncelleme” tarihini değiştiririz. Bir güncellemeden sonra Kit'i kullanmaya devam etmeniz, gözden geçirilmiş politikayı incelediğiniz anlamına gelir.

## İletişim

Gizlilik soruları: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

**Tim G (GitHub: TGthms)** tarafından yayımlanmıştır.
