

# Analisis Keseluruhan Sistem per Peran

## 1. SUPER ADMIN (`/admin`)

### Masalah UX/UI
- **Tab navigation overflow**: Ada 25 tab dalam satu TabsList (`grid-cols-8 lg:grid-cols-18`). Di layar kecil ini sangat sulit digunakan -- tab saling bertumpuk dan tersembunyi.
- **Tidak ada sidebar/grouped navigation**: Semua modul ditampilkan flat tanpa grouping. Seharusnya dikelompokkan (contoh: "E-Commerce" untuk Produk/Kategori/Pesanan/Seller/Dashboard Toko, "Konten" untuk Halaman/Banner/Template, dll.)
- **Duplikasi modul Shop**: Shop Products, Categories, Orders, dan Dashboard sudah ada di Admin tapi juga di ShopAdminDashboard. Tidak ada pembeda fitur antara keduanya.

### Masalah Fungsional
- **Konversi lead hardcoded 65%**: Di Agent overview, angka konversi "65%" dan "+12.5%" di revenue card adalah hardcoded, bukan dari data real.
- **Tidak ada export data**: Admin tidak bisa export laporan pesanan, user, atau revenue ke CSV/Excel.
- **Tidak ada notifikasi real-time**: Admin tidak mendapat notif saat ada order baru, pendaftaran agent baru, atau pembayaran masuk.

### Masalah Keamanan (dari Linter)
- **Security Definer View** terdeteksi -- view menggunakan permission creator bukan user.
- **RLS Policy Always True** -- ada policy yang terlalu permisif (mengizinkan semua INSERT/UPDATE/DELETE tanpa batasan).
- **Leaked Password Protection Disabled** -- proteksi password bocor belum diaktifkan.

---

## 2. SHOP ADMIN (`/shop-admin`)

### Masalah UX
- **Dashboard terlalu sederhana**: Hanya 4 stat card + 1 chart. Tidak ada trend waktu, tidak ada perbandingan periode.
- **Tidak bisa assign kurir**: Fitur kirim resi ada tapi kurir hanya dropdown statis. Tidak ada integrasi cek ongkir.
- **Tidak ada notifikasi order masuk**: Shop admin harus refresh manual untuk melihat pesanan baru.

### Masalah Fungsional
- **Tidak bisa manage seller**: Shop Admin hanya bisa kelola produk/kategori/pesanan, tapi seller management hanya ada di Super Admin. Seharusnya shop admin bisa moderasi seller juga.
- **Tidak ada fitur refund/return**: Tidak ada alur untuk penanganan retur atau refund.
- **Tidak ada invoice/cetak pesanan**: Tidak bisa generate invoice PDF untuk pesanan.

---

## 3. AGENT (`/agent`)

### Masalah UX
- **Data overview hardcoded**: "+12.5%" di revenue, "65%" konversi, dan "5 booking baru minggu ini" semuanya hardcoded -- bukan data real.
- **Website URL salah**: Card status website menampilkan `umroh.connect/{id}` padahal URL sebenarnya adalah `/travel/:slug`.
- **Tidak ada notifikasi aktif**: `unreadNotifications={0}` di header selalu 0.

### Masalah Fungsional
- **Tidak ada manajemen departure**: Agent bisa buat paket tapi tidak terlihat UI untuk kelola jadwal keberangkatan di dashboard utama.
- **Tidak ada bulk action**: Tidak bisa update beberapa paket sekaligus (aktif/nonaktif massal).
- **Chat tanpa notifikasi push**: Chat tersedia tapi tanpa push notification ke agent saat ada pesan baru.

---

## 4. SELLER (`/seller`)

### Masalah UX
- **Statistik kosong**: Tab "Statistik" hanya menampilkan placeholder "Statistik penjualan akan segera hadir" -- belum implementasi.
- **Settings read-only**: Tab "Pengaturan" hanya menampilkan info profil tanpa kemampuan edit.
- **Tidak ada order management**: Seller tidak bisa melihat pesanan yang masuk untuk produknya.

### Masalah Fungsional
- **Tidak bisa kelola pesanan sendiri**: Seller hanya manage produk, tapi order management sepenuhnya di admin. Seller seharusnya bisa melihat dan update status pesanan untuk produknya sendiri.
- **Tidak ada chat dengan buyer**: Tidak ada mekanisme komunikasi antara seller dan pembeli.
- **Tidak ada rating/review management**: Seller tidak bisa melihat atau merespon review dari pembeli.

---

## 5. USER / BUYER (Jamaah - halaman utama `/`)

### Masalah UX
- **Navigasi berbasis state bukan route**: Semua "sub-views" (Shop, Quran, Ibadah, dll) dikelola lewat `useState` boolean, bukan route. Artinya user tidak bisa bookmark, share link, atau gunakan tombol back browser.
- **Checkout tanpa info bank**: Setelah order dibuat, user tidak tahu ke mana harus transfer. Integrasi payment gateway ada di admin settings tapi info bank/QRIS tidak ditampilkan ke user saat checkout.
- **Tidak ada tracking pengiriman**: Setelah order dikirim, user tidak bisa melacak paket karena tidak ada integrasi tracking kurir.

### Masalah Fungsional
- **Edit profil tidak berfungsi**: Tombol "Pen" edit profil di AkunView ada tapi tidak melakukan apa-apa (tidak ada handler).
- **"Free Plan" hardcoded**: Label plan di profil selalu menampilkan "Free Plan" tanpa cek status langganan actual.
- **Tidak ada wishlist/favorit**: User tidak bisa menyimpan paket atau produk favorit.
- **Order history terpisah**: Riwayat pesanan shop ada di ShopView tapi booking umroh ada di AkunView -- pengalaman terfragmentasi.

---

## Prioritas Perbaikan yang Disarankan

### Kritis (Harus segera)
1. Fix keamanan: RLS policy terlalu permisif, aktifkan leaked password protection
2. Fix data hardcoded di Agent dashboard (revenue %, konversi %, booking mingguan)
3. Fix tombol edit profil yang tidak berfungsi
4. Tambahkan info pembayaran (bank/QRIS) di halaman checkout user

### Tinggi
5. Refactor navigasi Admin dari 25 flat tabs menjadi grouped sidebar
6. Konversi sub-views di Index.tsx dari useState ke proper routing
7. Implementasi statistik penjualan untuk Seller dashboard
8. Tambahkan order management untuk Seller (lihat & proses pesanan produknya)
9. Fix label "Free Plan" agar reflect status premium actual

### Sedang
10. Tambahkan export data CSV di Admin
11. Tambahkan notifikasi real-time untuk Admin & Shop Admin (order baru)
12. Seller bisa edit profil toko
13. Tambahkan invoice PDF untuk pesanan shop
14. Tambahkan wishlist/favorit untuk user

### Rendah (Nice to have)
15. Integrasi cek ongkir kurir
16. Chat buyer-seller
17. Bulk action untuk agent (aktif/nonaktif paket massal)
18. Refund/return flow

---

## Detail Teknis Implementasi

### Untuk fix keamanan (Prioritas 1):
- Jalankan database linter, identifikasi tabel dengan RLS `USING (true)` pada operasi write
- Ganti dengan policy yang cek `auth.uid()` atau `has_role()`
- Aktifkan leaked password protection di auth config

### Untuk refactor Admin navigation (Prioritas 5):
- Ganti `Tabs` component dengan layout sidebar + content area
- Group modul: Platform (Overview, Analitik, Settings), Users (Users, Travels, Membership, Kredit), Content (Halaman, Banner, Konten, Template, Doa, Tasbih), E-Commerce (Dashboard Toko, Produk, Kategori, Pesanan, Seller), Payment (Gateway, Subscriptions, Featured)

### Untuk proper routing di Index.tsx (Prioritas 6):
- Konversi `showShop`, `showQuran`, dll ke route params: `/?view=shop`, `/?view=quran`
- Atau gunakan nested routes: `/shop`, `/quran`, `/ibadah`
- Ini memungkinkan browser back button dan deep linking

