

# Rencana Pengembangan & Perbaikan E-Commerce

## A. Perbaikan Bug & Stabilitas (Prioritas Tinggi)

### 1. Upload Gambar Produk
Saat ini form produk admin hanya menerima URL gambar secara manual. Perlu ditambahkan fitur upload gambar langsung ke storage `shop-images` yang sudah tersedia.

### 2. Validasi Stok Saat Checkout
Belum ada pengecekan stok sebelum pesanan dibuat. Jika stok habis, pesanan tetap bisa dibuat. Perlu validasi stok di sisi frontend dan backend (edge function atau database constraint).

### 3. Upload Bukti Pembayaran
Alur pembayaran saat ini hanya membuat pesanan dengan status `pending` tanpa mekanisme upload bukti bayar dari sisi user. Perlu ditambahkan fitur upload bukti pembayaran pada halaman detail pesanan.

### 4. Penanganan User Belum Login di Toko
Saat user belum login, fitur keranjang akan error karena membutuhkan `user_id`. Perlu ditambahkan redirect ke login atau mode "tamu" yang menyimpan keranjang di localStorage.

---

## B. Peningkatan Fitur (Prioritas Sedang)

### 5. Pencarian & Filter Lanjutan
- Filter berdasarkan rentang harga (min-max)
- Sorting: harga terendah, harga tertinggi, terbaru, terlaris
- Filter produk featured saja

### 6. Notifikasi Status Pesanan
Menambahkan notifikasi real-time ketika admin mengubah status pesanan (misal: dari `processing` ke `shipped`). Menggunakan fitur Realtime yang sudah ada di proyek.

### 7. Resi & Tracking Pengiriman  
Menambahkan field nomor resi (tracking number) dan kurir pada tabel `shop_orders`. Admin bisa mengisi resi saat mengubah status ke `shipped`, dan user bisa melihatnya di detail pesanan.

### 8. Wishlist / Favorit Produk
Tabel baru `shop_wishlists` agar user bisa menandai produk yang diminati dan membeli nanti.

### 9. Review & Rating Produk
Memungkinkan user memberikan rating dan ulasan produk setelah status pesanan `delivered`. Ditampilkan pada halaman detail produk.

---

## C. Peningkatan Admin & Dashboard (Prioritas Sedang)

### 10. Upload Multi-Gambar Produk
Memanfaatkan kolom `images[]` yang sudah ada di tabel untuk menampilkan gallery gambar produk, bukan hanya satu thumbnail.

### 11. Export Data Pesanan
Fitur export pesanan ke CSV/Excel untuk keperluan rekap dan akuntansi.

### 12. Filter & Pencarian di Admin
Menambahkan filter status pesanan, pencarian produk berdasarkan nama, dan pagination di halaman admin.

### 13. Dashboard Toko yang Lebih Lengkap
- Grafik penjualan harian/mingguan/bulanan
- Perbandingan revenue per periode
- Produk yang paling sering dimasukkan keranjang tapi tidak dibeli (abandoned cart)

---

## D. Peningkatan UX (Prioritas Rendah)

### 14. Animasi & Loading State
Menambahkan skeleton loading, animasi transisi antar halaman toko, dan feedback visual yang lebih baik saat menambah ke keranjang.

### 15. Halaman Produk Dedikasi
Membuat halaman produk terpisah dengan URL sendiri (SEO friendly), bukan hanya modal. Termasuk breadcrumb navigasi.

### 16. Kategori dengan Gambar/Ikon
Menampilkan ikon atau gambar pada filter kategori agar lebih menarik secara visual.

---

## Urutan Implementasi yang Disarankan

| Tahap | Fitur | Estimasi |
|---|---|---|
| 1 | Upload gambar produk (#1) + validasi stok (#2) | Cepat |
| 2 | Upload bukti bayar (#3) + handle user belum login (#4) | Cepat |
| 3 | Nomor resi & tracking (#7) + notifikasi status (#6) | Sedang |
| 4 | Filter lanjutan (#5) + filter admin (#12) | Sedang |
| 5 | Review produk (#9) + wishlist (#8) | Sedang |
| 6 | Dashboard lengkap (#13) + export (#11) | Sedang |
| 7 | Multi-gambar (#10) + UX polish (#14, #15, #16) | Lama |

---

## Detail Teknis

### Perubahan Database yang Diperlukan

```text
-- Tahap 1: Tidak ada perubahan DB

-- Tahap 2: Tidak ada perubahan DB (reuse storage bucket shop-images)

-- Tahap 3: Tambah kolom di shop_orders
ALTER TABLE shop_orders ADD COLUMN tracking_number text;
ALTER TABLE shop_orders ADD COLUMN courier text;

-- Tahap 5: Tabel baru
shop_product_reviews: id, product_id, user_id, order_id, rating, review_text, created_at
shop_wishlists: id, user_id, product_id, created_at
```

### File Baru yang Akan Dibuat

```text
src/components/shop/PaymentUploadDialog.tsx   -- Upload bukti bayar
src/components/shop/ProductReviews.tsx        -- Review & rating produk
src/components/shop/WishlistView.tsx          -- Halaman wishlist
src/components/admin/ShopExportButton.tsx     -- Export CSV pesanan
src/hooks/useShopReviews.ts                  -- Hook review produk
src/hooks/useShopWishlist.ts                 -- Hook wishlist
```

### File yang Akan Diedit

```text
src/components/admin/ShopProductsManagement.tsx  -- Tambah upload gambar
src/components/shop/CheckoutView.tsx             -- Validasi stok
src/components/shop/OrderHistoryView.tsx          -- Tambah upload bukti bayar
src/components/shop/ProductDetailModal.tsx        -- Tampilkan review & wishlist
src/components/admin/ShopOrdersManagement.tsx     -- Input resi & kurir
src/components/admin/ShopDashboard.tsx            -- Grafik lebih lengkap
src/components/shop/ShopView.tsx                  -- Filter & sorting lanjutan
```

