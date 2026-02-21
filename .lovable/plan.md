

# Analisis Kekurangan & Rencana Perbaikan E-Commerce

## A. Kekurangan yang Ditemukan

### Sisi Seller (Penjual)

| No | Masalah | Tingkat | Dampak |
|----|---------|---------|--------|
| 1 | **Tidak ada upload logo & banner toko** - SellerSettingsTab hanya punya input teks, tidak ada upload gambar | Tinggi | Profil toko terlihat kosong di halaman publik |
| 2 | **WhatsApp tidak bisa diubah dari settings** - Field whatsapp tidak ada di SellerSettingsTab | Sedang | Seller tidak bisa update kontak WA |
| 3 | **Detail pesanan tidak lengkap** - Tidak menampilkan alamat lengkap, bukti bayar, atau catatan pembeli | Tinggi | Seller kesulitan memproses pengiriman |
| 4 | **Tidak ada notifikasi pesanan baru** - Seller harus buka dashboard manual | Tinggi | Pesanan terlambat diproses |
| 5 | **Statistik terlalu sederhana** - Tidak ada grafik tren waktu, tidak ada filter periode | Sedang | Seller tidak bisa analisis performa |
| 6 | **Tidak bisa upload multi-gambar produk** - Hanya 1 thumbnail, field `images[]` ada tapi tidak dipakai | Sedang | Produk kurang menarik |
| 7 | **Daftar chat tidak menampilkan nama buyer** - Hanya "Pesanan" atau "Chat Umum" | Sedang | Seller bingung siapa yang chat |
| 8 | **Tidak ada link "Lihat Toko Saya"** dari dashboard | Rendah | Seller tidak bisa preview tampilan publik |
| 9 | **Tidak ada fitur duplikat produk** | Rendah | Tambah produk serupa jadi lambat |

### Sisi Buyer (Jamaah/User Biasa)

| No | Masalah | Tingkat | Dampak |
|----|---------|---------|--------|
| 1 | **Tidak ada wishlist/favorit produk** | Sedang | Buyer tidak bisa simpan produk untuk nanti |
| 2 | **Tidak ada pencarian toko/seller** di ShopView | Sedang | Buyer harus tahu URL toko langsung |
| 3 | **Checkout tidak menghitung ongkir** - Total hanya harga produk | Tinggi | Biaya pengiriman tidak jelas |
| 4 | **Tidak ada pembatalan pesanan oleh buyer** - Status pending tidak bisa dibatalkan | Sedang | Buyer terjebak di pesanan yang tidak mau dilanjutkan |
| 5 | **Keranjang campur antar seller** - Tidak ada pemisahan per seller | Sedang | Bisa membingungkan saat checkout multi-seller |
| 6 | **Tidak ada notifikasi status pesanan berubah** untuk buyer | Tinggi | Buyer tidak tahu pesanan sudah dikirim |
| 7 | **Review hanya bisa dari OrderHistory** - Tidak ada link review di ProductDetailModal | Rendah | UX review kurang ditemukan |
| 8 | **Tidak ada deskripsi toko di StorePage** | Rendah | Buyer tidak tahu tentang toko |

---

## B. Rencana Perbaikan (Prioritas)

### Fase 1: Perbaikan Kritis (Segera)

#### 1.1 Seller Settings - Upload Logo, Banner, dan WhatsApp
- Tambah field upload logo dan banner di `SellerSettingsTab`
- Tambah field WhatsApp yang bisa diedit
- Gunakan komponen `ImageUpload` yang sudah ada

#### 1.2 Detail Pesanan Lengkap di Seller Dashboard
- Perbaiki dialog detail di `SellerOrdersTab` untuk menampilkan:
  - Alamat pengiriman lengkap (bukan hanya kota)
  - Bukti pembayaran (gambar dari `payment_proof_url`)
  - Catatan dari pembeli
  - Nomor telepon pembeli

#### 1.3 Buyer: Pembatalan Pesanan
- Tambah tombol "Batalkan Pesanan" di `OrderHistoryView` untuk pesanan `pending`
- Update status ke `cancelled` dan kembalikan stok

#### 1.4 StorePage: Tampilkan Deskripsi Toko
- Tambah deskripsi seller di antara info toko dan grid produk

### Fase 2: Peningkatan UX (Prioritas Tinggi)

#### 2.1 Notifikasi Pesanan untuk Seller & Buyer
- Manfaatkan tabel `chat_notifications` yang sudah ada, atau buat tabel `order_notifications`
- Trigger database: kirim notifikasi saat status pesanan berubah
- Tampilkan lonceng notifikasi di header Seller Dashboard dan di ShopView (buyer)

#### 2.2 Multi-Image Upload Produk
- Update `SellerProductForm` untuk mendukung array gambar
- Gunakan komponen `MultiImageUpload` yang sudah ada di project
- Tampilkan carousel gambar di `ProductDetailModal`

#### 2.3 Chat Buyer Name
- Update query di `SellerChatTab` untuk join ke `profiles` dan tampilkan nama buyer
- Tampilkan nama buyer di header chat

#### 2.4 Wishlist / Favorit
- Buat tabel `product_wishlist` (user_id, product_id)
- Tambah ikon hati di `ProductCard` dan `ProductDetailModal`
- Tambah tab/halaman "Favorit Saya" di akun

### Fase 3: Fitur Tambahan

#### 3.1 Estimasi Ongkir Sederhana
- Tambah konfigurasi biaya kirim per kota/wilayah di seller settings
- Tampilkan estimasi ongkir di `CheckoutView` berdasarkan kota tujuan

#### 3.2 Pencarian Toko di ShopView
- Tambah filter "Toko" di ShopView yang menampilkan daftar seller aktif
- Card seller yang bisa diklik menuju `/store/:sellerId`

#### 3.3 Link "Lihat Toko Saya" di Dashboard Seller
- Tambah tombol di header dashboard yang membuka `/store/:sellerId` di tab baru

#### 3.4 Duplikat Produk
- Tambah tombol "Duplikat" di daftar produk seller
- Pre-fill form dengan data produk yang ada (tanpa ID)

---

## C. Detail Teknis

### File yang Akan Dibuat

| File | Keterangan |
|------|------------|
| Migration SQL | Tabel `product_wishlist`, trigger notifikasi pesanan |
| `src/hooks/useWishlist.ts` | Hook CRUD wishlist |
| `src/components/shop/WishlistButton.tsx` | Tombol favorit (ikon hati) |
| `src/components/shop/WishlistView.tsx` | Halaman daftar favorit |

### File yang Akan Diubah

| File | Perubahan |
|------|-----------|
| `SellerSettingsTab.tsx` | Tambah upload logo, banner, field WhatsApp |
| `SellerOrdersTab.tsx` | Detail pesanan lengkap (alamat, bukti bayar, catatan, telp) |
| `SellerProductForm.tsx` | Multi-image upload menggunakan `MultiImageUpload` |
| `SellerChatTab.tsx` | Tampilkan nama buyer dari profiles |
| `SellerDashboard.tsx` | Tombol "Lihat Toko", tombol duplikat produk |
| `OrderHistoryView.tsx` | Tombol batalkan pesanan (pending), notifikasi |
| `StorePage.tsx` | Tampilkan deskripsi toko |
| `ProductDetailModal.tsx` | Carousel multi-gambar, tombol wishlist |
| `ProductCard.tsx` | Tombol wishlist |
| `ShopView.tsx` | Pencarian toko, lonceng notifikasi pesanan |
| `CheckoutView.tsx` | Estimasi ongkir sederhana |

### Skema Database Baru

```text
product_wishlist
- id (UUID, PK)
- user_id (UUID, NOT NULL)
- product_id (UUID, FK -> shop_products)
- created_at (TIMESTAMPTZ)
- UNIQUE(user_id, product_id)
- RLS: user bisa CRUD wishlist milik sendiri

order_notifications
- id (UUID, PK)
- user_id (UUID, NOT NULL) -- penerima
- order_id (UUID, FK -> shop_orders)
- type (TEXT) -- 'status_change', 'new_order'
- message (TEXT)
- is_read (BOOLEAN, default FALSE)
- created_at (TIMESTAMPTZ)
- RLS: user hanya bisa baca notifikasi milik sendiri
```

### Prioritas Implementasi

```text
Fase 1 (Kritis)
  |-- 1.1 Seller Settings lengkap
  |-- 1.2 Detail pesanan seller
  |-- 1.3 Batalkan pesanan buyer
  |-- 1.4 Deskripsi toko

Fase 2 (Tinggi)
  |-- 2.1 Notifikasi pesanan
  |-- 2.2 Multi-image produk
  |-- 2.3 Nama buyer di chat
  |-- 2.4 Wishlist

Fase 3 (Tambahan)
  |-- 3.1 Estimasi ongkir
  |-- 3.2 Pencarian toko
  |-- 3.3 Link "Lihat Toko"
  |-- 3.4 Duplikat produk
```

Saya menyarankan untuk mengimplementasikan secara bertahap mulai dari Fase 1, agar setiap perubahan bisa diuji dengan baik sebelum lanjut ke fase berikutnya.

