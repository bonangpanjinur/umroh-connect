
# Rencana: Penyempurnaan Alur Bisnis E-Commerce (Seller & Buyer)

## Analisis Kekurangan Saat Ini

Setelah meninjau seluruh kode dashboard seller, toko, checkout, dan pesanan, berikut adalah celah-celah yang ditemukan:

### Sisi Seller (Penjual)

| No | Kekurangan | Dampak |
|----|-----------|--------|
| 1 | Seller tidak bisa mengubah status pesanan (terima, proses, kirim) | Pesanan menumpuk tanpa progress |
| 2 | Tidak ada input resi pengiriman di dashboard seller | Buyer tidak bisa melacak paket |
| 3 | Tidak ada notifikasi pesanan baru | Seller tidak tahu ada order masuk |
| 4 | Upload gambar produk masih pakai URL manual | Sulit bagi seller non-teknis |
| 5 | Tidak ada halaman profil toko publik | Buyer tidak bisa lihat profil seller |
| 6 | Tidak ada fitur chat seller-buyer | Komunikasi sulit jika ada pertanyaan |

### Sisi Buyer (Pembeli)

| No | Kekurangan | Dampak |
|----|-----------|--------|
| 1 | Tidak ada tracking status pesanan real-time | Buyer tidak tahu progress |
| 2 | Tidak ada nomor resi yang bisa dilihat buyer | Tidak bisa cek pengiriman |
| 3 | Buyer tidak bisa konfirmasi "barang diterima" | Status pesanan tidak pernah jadi "delivered" |
| 4 | Tidak ada review/rating produk setelah beli | Tidak ada social proof |
| 5 | Tidak ada info seller di halaman produk (link toko) | Buyer tidak bisa lihat toko seller |

---

## Rencana Implementasi (Prioritas Tinggi)

### 1. Seller: Kelola Status Pesanan + Input Resi

Menambahkan kemampuan seller untuk:
- Melihat detail pesanan lengkap (alamat, bukti bayar)
- Mengubah status: `paid` -> `processing` -> `shipped`
- Input nomor resi dan nama kurir saat mengirim
- Tombol aksi per-status

**Komponen baru**: `SellerOrderActionDialog.tsx`
- Dialog untuk update status pesanan
- Form input resi (tracking number) dan kurir saat status `shipped`
- Validasi: hanya bisa maju (paid->processing->shipped), tidak bisa mundur

**Perubahan di `SellerOrdersTab.tsx`**:
- Tambah tombol aksi per pesanan (Proses, Kirim, Lihat Detail)
- Tampilkan alamat pengiriman
- Filter pesanan berdasarkan status

### 2. Buyer: Tracking Pesanan + Konfirmasi Terima

**Perubahan di `OrderHistoryView.tsx`**:
- Tampilkan progress bar status pesanan (stepper visual)
- Tampilkan nomor resi dan nama kurir jika sudah dikirim
- Tombol "Barang Diterima" untuk pesanan berstatus `shipped`
- Otomatis update status ke `delivered`

**Perubahan di `OrderDetailsDialog.tsx`**:
- Perbaiki agar buyer biasa hanya lihat info (tanpa tombol admin)
- Tampilkan tracking timeline

### 3. Seller: Upload Gambar Produk Langsung

**Perubahan di `SellerProductForm.tsx`**:
- Ganti input URL dengan komponen upload gambar ke storage bucket `shop-images`
- Gunakan komponen `ImageUpload` yang sudah ada di project
- Mendukung preview gambar sebelum upload

### 4. Buyer: Review Produk Setelah Beli

**Database**: Tabel `product_reviews` baru

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| product_id | UUID | FK ke shop_products |
| user_id | UUID | Pembeli |
| order_id | UUID | FK ke shop_orders |
| rating | INTEGER | 1-5 |
| review_text | TEXT | Ulasan |
| created_at | TIMESTAMPTZ | |

- RLS: user hanya bisa review produk yang sudah diterima (status: delivered)
- Satu review per produk per order

**Komponen baru**: `ProductReviewForm.tsx` (muncul di OrderHistory setelah delivered)
**Perubahan**: `ProductDetailModal.tsx` menampilkan rata-rata rating dan jumlah ulasan

### 5. Halaman Profil Toko Publik

**Halaman baru**: `/store/:sellerId`
- Menampilkan info toko: nama, deskripsi, kota, rating, badge verified
- Grid produk milik seller tersebut
- Link dari `ProductCard` dan `ProductDetailModal` ke halaman toko

---

## Detail Teknis

### File yang Dibuat

| File | Keterangan |
|------|------------|
| `src/components/seller/SellerOrderActionDialog.tsx` | Dialog update status + input resi |
| `src/components/shop/OrderStatusStepper.tsx` | Komponen visual progress pesanan |
| `src/components/shop/ProductReviewForm.tsx` | Form review produk |
| `src/components/shop/ProductReviews.tsx` | Daftar review di detail produk |
| `src/pages/StorePage.tsx` | Halaman profil toko publik |
| `src/hooks/useProductReviews.ts` | Hook CRUD review produk |
| Migration SQL | Tabel product_reviews |

### File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/components/seller/SellerOrdersTab.tsx` | Tambah tombol aksi, filter status, detail pesanan |
| `src/components/seller/SellerProductForm.tsx` | Ganti input URL -> upload gambar |
| `src/components/shop/OrderHistoryView.tsx` | Tambah stepper, tracking info, tombol konfirmasi terima |
| `src/components/shop/OrderDetailsDialog.tsx` | Pisahkan tampilan buyer vs merchant |
| `src/components/shop/ProductDetailModal.tsx` | Tampilkan rating & link toko |
| `src/components/shop/ProductCard.tsx` | Tampilkan rating |
| `src/hooks/useSellerOrders.ts` | Tambah mutation update status + resi |
| `src/hooks/useShopOrders.ts` | Tambah mutation konfirmasi terima |
| `src/App.tsx` | Tambah route `/store/:sellerId` |

### Alur Bisnis Lengkap Setelah Perubahan

```text
BUYER                           SELLER
  |                               |
  |-- Beli produk, checkout ------>|
  |                               |-- Terima notifikasi pesanan baru
  |                               |
  |-- Upload bukti bayar -------->|
  |                               |-- Lihat bukti, klik "Proses"
  |                               |   (status: paid -> processing)
  |                               |
  |                               |-- Kemas barang, input resi
  |                               |   klik "Kirim"
  |                               |   (status: processing -> shipped)
  |                               |
  |<-- Lihat resi & tracking -----|
  |                               |
  |-- Barang sampai,              |
  |   klik "Barang Diterima"      |
  |   (status: shipped -> delivered)
  |                               |
  |-- Tulis review & rating ----->|
  |                               |-- Rating toko terupdate
```

### Stepper Visual Pesanan (Buyer)

```text
[Menunggu Bayar] -> [Dibayar] -> [Diproses] -> [Dikirim] -> [Selesai]
     (pending)       (paid)    (processing)    (shipped)   (delivered)
```

Setiap langkah ditampilkan sebagai dot/step dengan warna hijau jika sudah lewat, biru untuk status aktif, dan abu-abu untuk yang belum.

### Seller Order Actions Per Status

| Status Saat Ini | Aksi Tersedia |
|-----------------|---------------|
| pending | Menunggu pembayaran (tidak ada aksi) |
| paid | Tombol "Proses Pesanan" |
| processing | Tombol "Kirim" + form input resi & kurir |
| shipped | Menunggu konfirmasi buyer |
| delivered | Selesai |
| cancelled | Dibatalkan |
