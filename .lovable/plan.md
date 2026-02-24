
# Laporan Bug & Rencana Perbaikan E-Commerce

## Bug yang Ditemukan

### BUG 1 (Kritis): Seller Tidak Bisa Melihat Pesanan

Kebijakan RLS pada tabel `shop_orders` hanya mengizinkan SELECT untuk:
- `user_id = auth.uid()` (pembeli)
- `admin` atau `shop_admin`

**Seller tidak termasuk dalam kebijakan SELECT.** Akibatnya, hook `useSellerOrders` yang melakukan join `order:shop_orders(*)` akan selalu mengembalikan `order: null`, sehingga:
- Tab Pesanan di dashboard seller **kosong** (semua data pesanan null)
- Statistik penjualan **selalu nol**
- Detail pesanan (nama penerima, alamat, bukti bayar) **tidak tampil**

Masalah yang sama terjadi pada `shop_order_items` -- kebijakan SELECT-nya juga hanya mengizinkan pembeli/admin, bukan seller.

**Perbaikan:** Tambahkan kebijakan SELECT pada `shop_orders` dan `shop_order_items` yang mengizinkan seller melihat pesanan terkait produk mereka.

---

### BUG 2 (Sedang): Label "Kategori Toko" Salah

Di `ShopCategoriesManagement.tsx` baris 77, `CardTitle` bertuliskan **"Kategori Toko"** padahal yang dikelola adalah kategori produk.

**Perbaikan:** Ubah label menjadi "Kategori Produk".

---

### BUG 3 (Sedang): Data Quran Belum Tersinkron

Tabel `quran_ayahs` memiliki **0 ayat** tersimpan. Tabel `quran_surahs` sudah memiliki 114 surat, tetapi kolom `english_name`, `revelation_type`, dan `translation_name` semuanya `null`.

Edge function `sync-quran-data` sudah benar secara kode. Masalahnya adalah **belum pernah dijalankan** oleh admin. Ini bukan bug kode, tetapi perlu diperbaiki UX-nya agar admin tahu harus menjalankan sinkronisasi pertama.

**Perbaikan:** Tambahkan banner/alert di Quran Management yang mendeteksi jika 0 ayat tersimpan dan menampilkan tombol "Sinkronisasi Pertama" yang lebih menonjol.

---

### BUG 4 (Sedang): Duplikat Produk Seller -- ID undefined Dikirim ke Database

Di `SellerDashboard.tsx` baris 238, saat duplikat produk:
```typescript
setEditingProduct({ ...product, id: undefined as any, ... })
```
Properti `id` tetap ada dengan nilai `undefined`. Di `SellerProductForm.tsx` baris 67:
```typescript
...(product?.id ? { id: product.id } : {})
```
Karena `undefined` adalah falsy, ini seharusnya aman. **Namun**, `product.slug` di-set ke `''` (string kosong), dan `generateSlug` di `handleSubmit` akan menghasilkan slug dari nama baru. Masalahnya: jika slug duplikat sudah ada di database, INSERT akan gagal karena unique constraint pada slug.

**Perbaikan:** Generate slug unik saat duplikat dengan menambahkan timestamp/random suffix.

---

### BUG 5 (Rendah): Buyer Tidak Bisa Chat Seller pada Pesanan Pending

Di `OrderHistoryView.tsx` baris 225, tombol "Chat Penjual" hanya muncul jika status bukan `cancelled` dan bukan `pending`:
```typescript
{order.status !== 'cancelled' && order.status !== 'pending' && (...)}
```
Pembeli yang sudah membuat pesanan tetapi belum bayar tidak bisa menghubungi seller untuk bertanya. Ini mengurangi kemungkinan konversi pembayaran.

**Perbaikan:** Tampilkan tombol chat untuk semua status kecuali `cancelled`.

---

### BUG 6 (Sedang): Duplikat Kebijakan UPDATE pada shop_orders

Ada 3 kebijakan UPDATE yang tumpang tindih:
1. "Admin/shop_admin update orders" -- mengizinkan owner + admin + shop_admin
2. "Buyers can update own orders" -- mengizinkan owner (sudah tercakup di #1)
3. "Sellers can update orders for their products"

Kebijakan #2 redundan dengan #1 dan bisa membingungkan.

**Perbaikan:** Hapus kebijakan "Buyers can update own orders" karena sudah tercakup oleh "Admin/shop_admin update orders".

---

## Rencana Perbaikan

### 1. Migration SQL: Perbaiki RLS Seller

Tambahkan kebijakan SELECT agar seller bisa melihat pesanan yang berisi produk mereka:

```text
-- shop_orders: Seller can view orders containing their products
CREATE POLICY "Sellers can view orders for their products"
ON public.shop_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shop_order_items soi
    JOIN shop_products sp ON soi.product_id = sp.id
    JOIN seller_profiles selp ON sp.seller_id = selp.id
    WHERE soi.order_id = shop_orders.id
    AND selp.user_id = auth.uid()
  )
);

-- shop_order_items: Seller can view order items for their products
CREATE POLICY "Sellers can view own product order items"
ON public.shop_order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shop_products sp
    JOIN seller_profiles selp ON sp.seller_id = selp.id
    WHERE sp.id = shop_order_items.product_id
    AND selp.user_id = auth.uid()
  )
);

-- Cleanup: drop redundant policy
DROP POLICY IF EXISTS "Buyers can update own orders" ON public.shop_orders;
```

### 2. Perbaiki Label Kategori (ShopCategoriesManagement.tsx)
- Baris 77: "Kategori Toko" menjadi "Kategori Produk"

### 3. Perbaiki UX Quran Management (QuranManagement.tsx)
- Tambahkan banner alert ketika `totalAyahs === 0` yang menampilkan pesan "Data belum tersinkron" dengan tombol CTA sinkronisasi
- Tambahkan indikator progress saat sinkronisasi batch berjalan

### 4. Perbaiki Duplikat Produk (SellerDashboard.tsx)
- Generate slug unik dengan suffix timestamp saat duplikat:
  ```text
  slug: generateSlug(product.name + '-copy-' + Date.now().toString(36))
  ```

### 5. Tampilkan Chat untuk Pesanan Pending (OrderHistoryView.tsx)
- Ubah kondisi dari `order.status !== 'cancelled' && order.status !== 'pending'` menjadi `order.status !== 'cancelled'`

### Detail Teknis

| File | Perubahan |
|------|-----------|
| Migration SQL baru | Tambah SELECT policy seller di `shop_orders` dan `shop_order_items`, hapus policy redundan |
| `src/components/admin/ShopCategoriesManagement.tsx` | Ubah "Kategori Toko" -> "Kategori Produk" (baris 77) |
| `src/components/admin/QuranManagement.tsx` | Tambah banner sinkronisasi pertama + progress indicator |
| `src/pages/SellerDashboard.tsx` | Perbaiki slug duplikat produk (baris 238) |
| `src/components/shop/OrderHistoryView.tsx` | Izinkan chat pada pesanan pending (baris 225) |

### Alur E-Commerce yang Jelas

Setelah perbaikan ini, alur e-commerce akan menjadi:

```text
ADMIN (Super Admin)
+-- /shop-admin
    +-- Dashboard: ringkasan statistik toko
    +-- Produk: CRUD semua produk dari semua seller
    +-- Kategori Produk: CRUD kategori
    +-- Pesanan: lihat & kelola semua pesanan (ubah status, input resi)
    +-- Seller: approve/reject pendaftaran seller, verifikasi

SELLER
+-- /seller-dashboard
    +-- Produk: CRUD produk miliknya, duplikat produk
    +-- Pesanan: lihat pesanan yang berisi produknya, proses & kirim
    +-- Chat: komunikasi dengan pembeli per pesanan
    +-- Statistik: revenue, top produk, jumlah terjual
    +-- Settings: branding toko, ongkir, WhatsApp

BUYER (Jamaah)
+-- Halaman Toko (/oleh-oleh via menu utama)
    +-- Browse produk: filter kategori, harga, sorting, search
    +-- Browse toko: cari seller, lihat profil toko
    +-- Keranjang: tambah/kurangi/hapus item
    +-- Checkout: isi alamat, lihat ongkir, buat pesanan
    +-- Pembayaran: lihat rekening/QRIS, upload bukti bayar
    +-- Riwayat Pesanan: tracking, konfirmasi terima, review, chat seller
    +-- Wishlist: simpan produk favorit
```
