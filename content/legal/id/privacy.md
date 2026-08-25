# Kebijakan Privasi

**Terakhir diperbarui:** 15 Juli 2026

Kebijakan ini menjelaskan cara informasi ditangani ketika Anda menggunakan **Kit**, kumpulan utilitas yang diterbitkan sebagai situs web statis dan dirancang untuk berjalan di browser Anda.

## Gagasan utama

Kit dirancang agar **pekerjaan atas file Anda berlangsung di perangkat Anda**. Kami tidak mengoperasikan server aplikasi yang menerima, menyimpan, atau menganalisis isi dokumen, gambar, atau media yang Anda buka di dalam alat.

## Hal yang tidak dilakukan Kit

Saat Anda menggunakan alat (misalnya menggabungkan PDF atau mengompresi gambar):

- File Anda **tidak diunggah** ke backend Kit untuk diproses.
- Kami **tidak membuat akun pengguna**.
- Kami **tidak menjual data pribadi**.
- Kami **tidak menggunakan SDK iklan atau pelacakan lintas situs untuk iklan**.

## Informasi yang mungkin ada di sekitar layanan

### 1. Data yang tetap berada di perangkat Anda

Browser Anda dapat menyimpan informasi terbatas secara lokal, seperti:

- Preferensi tampilan (terang, gelap, atau sistem)
- Bahasa yang dipilih
- Alat favorit atau yang disematkan
- **Ringkasan riwayat** (alat yang digunakan, kira-kira kapan, deskripsi singkat) — **bukan** isi file Anda
- Preset yang Anda pilih untuk disimpan

Anda dapat menghapus riwayat di Pengaturan atau menghapus data situs ini di browser.

### 2. Log jaringan dan hosting

Kit biasanya di-host sebagai file statis (misalnya di GitHub Pages). Saat browser Anda meminta halaman dan aset, host dapat secara otomatis mencatat data teknis standar seperti alamat IP, user agent, stempel waktu, dan URL yang diminta. Pencatatan tersebut dikendalikan oleh infrastruktur dan kebijakan host — bukan oleh server Kit yang membuka dokumen Anda.

### 3. Sumber daya pihak ketiga opsional

Beberapa fitur lanjutan dapat memuat pustaka pemrosesan (misalnya inti FFmpeg WebAssembly atau skrip PDF worker) dari jaringan pengiriman konten saat pertama kali Anda menggunakannya. Permintaan tersebut dapat mengekspos metadata jaringan standar kepada CDN. Isi file Anda tetap diproses di browser; CDN menyediakan kode, bukan dokumen Anda.

### 4. Kurs mata uang

Saat Anda menyegarkan kurs mata uang, browser ini meminta data dari API publik Frankfurter. Permintaan tersebut dapat membagikan metadata jaringan standar (seperti alamat IP, user agent, waktu, dan URL yang diminta) kepada Frankfurter. Kurs dapat berasal dari cache browser ini dan mungkin sudah kedaluwarsa. Kurs tersebut hanya data referensi harian, bukan jaminan untuk perdagangan, akuntansi, pajak, atau penyelesaian transaksi.

## Progressive Web App (PWA)

Jika Anda menginstal Kit atau mengizinkan penggunaan offline, service worker dapat menyimpan **kerangka aplikasi** (halaman, skrip, gaya, dan ikon) di cache. Kit tidak dirancang untuk menyimpan file pribadi Anda di cache tersebut.

## Anak-anak

Kit adalah utilitas untuk penggunaan umum. Kit tidak ditujukan untuk anak-anak di bawah 13 tahun dan, karena Kit tidak menyediakan akun, kami tidak dengan sengaja mengumpulkan informasi pribadi anak melalui sistem pendaftaran.

## Perubahan

Kami dapat memperbarui kebijakan ini ketika produk atau persyaratan hukum berubah. Kami akan memperbarui tanggal “Terakhir diperbarui” saat melakukannya. Melanjutkan penggunaan Kit setelah pembaruan berarti Anda telah meninjau kebijakan yang direvisi.

## Kontak

Pertanyaan privasi: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Diterbitkan oleh **Tim G (GitHub: TGthms)**.
