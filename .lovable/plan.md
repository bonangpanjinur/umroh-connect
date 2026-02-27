

# Analisis Kekurangan Fitur - Arah Umroh

## 1. Pengalaman Pengguna Baru (Onboarding)

**Masalah**: Tidak ada onboarding/tutorial untuk pengguna baru. Setelah registrasi, pengguna langsung dilempar ke halaman utama tanpa panduan.

**Rekomendasi**:
- Tambahkan welcome screen interaktif (3-4 langkah) setelah registrasi pertama kali
- Highlight fitur utama: Tracker Ibadah, Paket Umroh, Oleh-oleh
- Tooltip panduan di Quick Menu saat pertama kali dibuka

---

## 2. Profil Pengguna Minim

**Masalah**: Profil hanya menyimpan nama, email, phone, avatar. Tidak ada field untuk:
- Alamat lengkap (penting untuk pengiriman oleh-oleh)
- Nomor paspor / data dokumen perjalanan
- Riwayat umroh/haji sebelumnya
- Kontak darurat

**Rekomendasi**: Tambahkan halaman "Lengkapi Profil" dengan data perjalanan dan alamat default untuk checkout.

---

## 3. Wishlist Produk Ada, tapi Halaman Wishlist Tidak Ada

**Masalah**: Tombol wishlist sudah berfungsi di ProductCard, tapi tidak ada halaman khusus untuk melihat semua produk yang di-wishlist.

**Rekomendasi**: Tambahkan tab/halaman "Favorit Saya" di ShopView atau di menu Akun.

---

## 4. Checkout Belum Terintegrasi Payment Gateway

**Masalah**: Checkout hanya menampilkan info rekening dan upload bukti transfer manual. Tidak ada integrasi payment gateway otomatis (Midtrans sudah ada hook-nya tapi belum digunakan di checkout oleh-oleh).

**Rekomendasi**: Integrasikan `useMidtrans` hook yang sudah ada ke CheckoutView untuk pembayaran otomatis.

---

## 5. Notifikasi Push Belum Efektif

**Masalah**: Infrastruktur push notification sudah ada (`usePushNotifications`), tapi:
- Belum ada notifikasi saat status pesanan berubah (seller memproses/kirim)
- Belum ada reminder pembayaran otomatis
- Belum ada notifikasi konten baru (banner/promo)

**Rekomendasi**: Hubungkan trigger database `order_status_change` dengan edge function `send-push-notification`.

---

## 6. Fitur Chat Terbatas

**Masalah**:
- Chat buyer-seller tidak punya indikator "read/unread" yang jelas
- Tidak ada fitur kirim gambar dalam chat
- Tidak ada auto-reply/template pesan untuk seller

**Rekomendasi**: Tambahkan read receipt, image attachment, dan quick reply templates.

---

## 7. Halaman Toko Seller Kurang Informatif

**Masalah**: StorePage (`/store/:sellerId`) menampilkan produk tapi tidak ada:
- Banner toko kustom
- Deskripsi toko
- Jam operasional
- Kebijakan pengembalian
- Rating & review toko (hanya per-produk)

**Rekomendasi**: Perkaya halaman toko dengan profil seller yang lengkap.

---

## 8. Tidak Ada Fitur Pencarian Global

**Masalah**: Pencarian hanya tersedia per-konteks (produk di ShopView, paket di PaketView). Tidak ada search bar global di header untuk mencari lintas fitur.

**Rekomendasi**: Tambahkan pencarian global di AppHeader yang bisa mencari paket umroh, produk, dan doa sekaligus.

---

## 9. Social Sharing Tidak Ada

**Masalah**: Tidak ada tombol share ke WhatsApp/sosial media untuk:
- Paket umroh (jamaah share ke teman)
- Produk oleh-oleh
- Progress ibadah / achievement

**Rekomendasi**: Tambahkan share button dengan Web Share API di PackageCard dan ProductCard.

---

## 10. Statistik Seller Kurang Detail

**Masalah**: SellerStatsTab hanya menampilkan ringkasan dasar. Kurang:
- Grafik penjualan per hari/minggu/bulan
- Produk terlaris
- Breakdown pendapatan per produk
- Customer retention rate

**Rekomendasi**: Gunakan Recharts (sudah terinstall) untuk visualisasi data penjualan yang lebih kaya.

---

## 11. Multi-bahasa Belum Konsisten

**Masalah**: Ada `LanguageContext` dan `useLanguage` hook, tapi hampir semua teks UI masih hardcoded dalam Bahasa Indonesia. Fungsi `t()` tidak digunakan secara konsisten.

**Rekomendasi**: Jika multi-bahasa bukan prioritas, hapus fitur ini untuk mengurangi kompleksitas. Jika dibutuhkan, lakukan i18n secara menyeluruh.

---

## 12. Laporan & Export Data Admin

**Masalah**: Admin tidak bisa export data ke CSV/Excel untuk:
- Daftar pengguna
- Daftar pesanan
- Laporan keuangan
- Data booking

**Rekomendasi**: Tambahkan tombol "Export CSV" di setiap management table di AdminDashboard.

---

## 13. Kupon & Diskon Belum Ada

**Masalah**: Tidak ada sistem kupon/voucher untuk:
- Diskon produk oleh-oleh
- Potongan harga paket umroh
- Promo referral

**Rekomendasi**: Buat tabel `coupons` dengan validasi di checkout.

---

## 14. Tracking Pengiriman Oleh-oleh

**Masalah**: Setelah seller mengirim barang, buyer tidak bisa melacak pengiriman. Tidak ada field nomor resi.

**Rekomendasi**: Tambahkan field `tracking_number` dan `courier` di `shop_orders`, plus integrasi API cek resi (RajaOngkir/Biteship).

---

## 15. Grup Jamaah / Komunitas

**Masalah**: Ada `GroupTrackingView` untuk tracking lokasi grup, tapi tidak ada fitur komunitas/forum untuk jamaah saling berkomunikasi dan berbagi pengalaman.

**Rekomendasi**: Tambahkan fitur grup diskusi per-keberangkatan atau per-travel agent.

---

## Prioritas Implementasi

| Prioritas | Fitur | Dampak |
|-----------|-------|--------|
| Tinggi | Halaman Wishlist | UX e-commerce |
| Tinggi | Nomor Resi & Tracking | Kepercayaan buyer |
| Tinggi | Social Sharing | Pertumbuhan organik |
| Tinggi | Profil lengkap + alamat default | Efisiensi checkout |
| Sedang | Kupon & Diskon | Konversi penjualan |
| Sedang | Pencarian Global | UX navigasi |
| Sedang | Statistik Seller Detail | Retensi seller |
| Sedang | Export Data Admin | Operasional |
| Rendah | Onboarding Tutorial | First-time experience |
| Rendah | Chat Enhancement | Komunikasi |
| Rendah | Komunitas Jamaah | Engagement |

