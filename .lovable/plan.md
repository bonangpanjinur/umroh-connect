

# Analisis Lengkap & Rencana Perbaikan Sistem

## Temuan Masalah Aktif

### A. Bug & Error di Console
1. **React ref warning di MealTrackingView** -- Dialog component tidak menggunakan `forwardRef`, menyebabkan warning di console setiap kali Ibadah Hub dibuka.

### B. Keamanan (dari Linter - 3 issue)
1. **Security Definer View (ERROR)** -- View menggunakan permission creator, bukan user yang query. Berbahaya karena bypass RLS.
2. **RLS Policy Always True (WARN)** -- Ada policy INSERT/UPDATE/DELETE yang menggunakan `USING(true)` atau `WITH CHECK(true)` tanpa filter user.
3. **Leaked Password Protection Disabled (WARN)** -- Proteksi password bocor belum diaktifkan di auth config.

### C. Agent Dashboard
1. **Share URL masih pakai `travel.id`** -- `handleShare()` di baris 119 masih menyalin `/travel/${travel.id}` bukan `/travel/${travel.admin_approved_slug || travel.id}`. Card status website sudah benar, tapi tombol share belum.

### D. Seller Dashboard (Masih banyak placeholder)
1. **Tab "Statistik" kosong** -- Hanya placeholder text, tidak ada data penjualan.
2. **Tab "Pengaturan" read-only** -- Tidak bisa edit nama toko, telepon, kota.
3. **Tidak ada order management** -- Seller tidak bisa lihat pesanan untuk produknya.

### E. Checkout User
1. **Tidak ada info pembayaran** -- Setelah order dibuat, user tidak tahu harus transfer ke mana. Tidak ada info bank/QRIS yang ditampilkan.

### F. Shop Admin Dashboard
1. **Terlalu sederhana** -- Hanya 4 tab dengan komponen yang sama persis dengan yang ada di Admin. Tidak ada fitur unik (seller management, invoice).

---

## Rencana Implementasi (Prioritas)

### Tahap 1: Fix Bug & Keamanan

**1.1 Fix MealTrackingView ref warning**
- Wrap komponen Dialog child dengan `React.forwardRef` di `MealTrackingView.tsx`

**1.2 Fix RLS policies yang terlalu permisif**
- Query analytics DB untuk identifikasi tabel dengan policy `USING(true)` pada write operations
- Buat migration SQL untuk mengganti dengan policy yang cek `auth.uid()`
- Pastikan tabel publik (produk, banner) tetap bisa diakses read-only

**1.3 Aktifkan leaked password protection**
- Konfigurasi di auth settings via migration atau config

### Tahap 2: Fix Agent Share URL

**2.1 Update `handleShare()` di AgentDashboard.tsx**
- Ganti `travel.id` dengan `travel.admin_approved_slug || travel.id` agar konsisten dengan card status website

### Tahap 3: Seller Dashboard Enhancement

**3.1 Implementasi Statistik Penjualan**
- Query `shop_orders` + `shop_order_items` yang terkait produk seller
- Tampilkan: total revenue, jumlah pesanan, produk terlaris
- Chart trend penjualan 7 hari terakhir

**3.2 Seller Order Management**
- Buat tab "Pesanan" baru di Seller Dashboard
- Query pesanan yang mengandung produk milik seller
- Seller bisa update status item (proses/kirim/selesai)

**3.3 Edit Profil Toko**
- Ubah tab "Pengaturan" dari read-only ke editable form
- Field: nama toko, deskripsi, telepon, kota, logo
- Save ke tabel `sellers`

### Tahap 4: Info Pembayaran di Checkout

**4.1 Tampilkan info bank/QRIS setelah order**
- Baca konfigurasi payment dari `payment_gateway_settings`
- Setelah order sukses, tampilkan halaman konfirmasi dengan:
  - Nomor rekening bank / QRIS image
  - Nominal yang harus ditransfer
  - Batas waktu pembayaran
  - Tombol upload bukti transfer

### Tahap 5: Perbaikan Minor

**5.1 Language toggle button** -- Tombol "ID" di header tidak punya handler, hanya tampil statis. Hubungkan ke `LanguageSelector` atau buat dropdown bahasa.

---

## Detail Teknis

### Database Migration (Tahap 1.2)
```text
-- Contoh fix RLS
-- Ganti policy "Anyone can insert" menjadi "Authenticated users can insert own"
DROP POLICY IF EXISTS "anyone_can_insert" ON some_table;
CREATE POLICY "auth_users_insert" ON some_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Seller Stats Query (Tahap 3.1)
```text
-- Ambil order items yang produknya milik seller
SELECT soi.*, so.status, so.created_at
FROM shop_order_items soi
JOIN shop_orders so ON so.id = soi.order_id
JOIN shop_products sp ON sp.id = soi.product_id
WHERE sp.seller_id = $seller_id
ORDER BY so.created_at DESC
```

### File yang Akan Diubah
- `src/components/habit/MealTrackingView.tsx` -- fix forwardRef warning
- `src/pages/AgentDashboard.tsx` -- fix share URL (1 baris)
- `src/pages/SellerDashboard.tsx` -- tambah stats, orders, edit settings
- `src/hooks/useSellerOrders.ts` -- hook baru untuk query pesanan seller
- `src/components/shop/CheckoutView.tsx` -- tambah info pembayaran post-order
- `src/hooks/usePublicPaymentConfig.ts` -- fetch payment config untuk user
- Database migration -- fix RLS policies

