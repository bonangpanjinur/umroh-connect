

# Plan: E-Commerce Oleh-Oleh & Perlengkapan Umroh

## Ringkasan

Menambahkan fitur toko online untuk oleh-oleh dan perlengkapan umroh. **Admin yang sudah ada** tetap menjadi pengelola utama (super admin). Ditambahkan role baru **`shop_admin`** khusus untuk mengelola toko (produk, kategori, pesanan).

---

## 1. Perubahan Database

### Role Baru
- Tambah `'shop_admin'` ke enum `app_role`

### Tabel Baru

| Tabel | Fungsi |
|---|---|
| `shop_categories` | Kategori produk (Oleh-oleh, Pakaian Ihram, Perlengkapan, dll) |
| `shop_products` | Produk: nama, harga, stok, berat, gambar, status |
| `shop_carts` | Keranjang per user |
| `shop_cart_items` | Item dalam keranjang |
| `shop_orders` | Pesanan dengan status tracking |
| `shop_order_items` | Detail item per pesanan (snapshot harga) |

### Enum Baru
- `shop_order_status`: pending, paid, processing, shipped, delivered, cancelled

### Storage
- Bucket baru `shop-images` (public)

### RLS Policies
- Produk & kategori: public read, write hanya `admin` dan `shop_admin`
- Cart: user hanya akses miliknya (`user_id = auth.uid()`)
- Orders: user lihat miliknya, `admin` dan `shop_admin` lihat semua
- Trigger untuk auto-generate order code (`SH-YYYYMMDD-XXXX`)
- Trigger untuk update stok saat order dibayar/dibatalkan

---

## 2. File Baru

### Komponen User
| File | Fungsi |
|---|---|
| `src/components/shop/ShopView.tsx` | Halaman toko: grid produk + filter kategori + search |
| `src/components/shop/ProductCard.tsx` | Card produk (gambar, nama, harga, tombol beli) |
| `src/components/shop/ProductDetailModal.tsx` | Detail produk + pilih jumlah + tambah keranjang |
| `src/components/shop/CartSheet.tsx` | Side drawer keranjang belanja |
| `src/components/shop/CheckoutView.tsx` | Form checkout (alamat, ringkasan, bayar) |
| `src/components/shop/OrderHistoryView.tsx` | Riwayat pesanan user |

### Komponen Admin / Shop Admin
| File | Fungsi |
|---|---|
| `src/components/admin/ShopProductsManagement.tsx` | CRUD produk + upload gambar |
| `src/components/admin/ShopCategoriesManagement.tsx` | CRUD kategori |
| `src/components/admin/ShopOrdersManagement.tsx` | Kelola pesanan + ubah status |
| `src/components/admin/ShopDashboard.tsx` | Statistik penjualan (revenue, produk terlaris) |

### Hooks & Types
| File | Fungsi |
|---|---|
| `src/hooks/useShopProducts.ts` | Fetch produk, filter, search |
| `src/hooks/useShopCart.ts` | Kelola keranjang (add, remove, qty) |
| `src/hooks/useShopOrders.ts` | Buat order, fetch riwayat |
| `src/hooks/useShopAdmin.ts` | Admin: CRUD produk, kategori, pesanan |
| `src/types/shop.ts` | TypeScript interfaces |

---

## 3. File yang Diedit

| File | Perubahan |
|---|---|
| `src/types/database.ts` | Tambah `'shop_admin'` ke `AppRole` |
| `src/hooks/useAuth.ts` | Tambah `isShopAdmin()` helper |
| `src/contexts/AuthContext.tsx` | Expose `isShopAdmin()` |
| `src/pages/Index.tsx` | Tambah state `showShop` + render `ShopView` |
| `src/components/home/QuickMenu.tsx` | Tambah menu "Oleh-oleh" (icon `ShoppingBag`) |
| `src/pages/AdminDashboard.tsx` | Tambah 4 tab: Produk, Kategori Toko, Pesanan Toko, Dashboard Toko |
| `src/App.tsx` | Tambah route `/shop/orders` untuk riwayat pesanan |

---

## 4. Alur Kerja

```text
JAMAAH (User):
  QuickMenu [Oleh-oleh] --> ShopView (browse)
    --> ProductDetailModal --> Tambah ke Keranjang
    --> CartSheet --> CheckoutView
    --> Order Created (status: pending)
    --> Upload bukti bayar --> Status: paid

SHOP ADMIN:
  AdminDashboard [Tab Produk] --> CRUD produk + gambar
  AdminDashboard [Tab Kategori] --> Kelola kategori
  AdminDashboard [Tab Pesanan] --> Update status pesanan

ADMIN (Super):
  Semua akses shop_admin + ShopDashboard (statistik & monitoring)
  + Kelola user shop_admin via tab Users
```

---

## 5. Detail Teknis

### Skema Tabel

```text
shop_categories:
  id (UUID PK), name, slug, icon, description,
  sort_order, is_active, created_at, updated_at

shop_products:
  id (UUID PK), category_id (FK), name, slug,
  description, price, compare_price, stock,
  weight_gram, thumbnail_url, images (text[]),
  is_active, is_featured, created_at, updated_at

shop_carts:
  id (UUID PK), user_id (UUID NOT NULL), created_at, updated_at

shop_cart_items:
  id (UUID PK), cart_id (FK), product_id (FK),
  quantity, created_at

shop_orders:
  id (UUID PK), user_id, order_code, status (enum),
  total_amount, shipping_name, shipping_phone,
  shipping_address, shipping_city, shipping_postal_code,
  notes, payment_proof_url, paid_at, created_at, updated_at

shop_order_items:
  id (UUID PK), order_id (FK), product_id (FK),
  product_name, product_price, quantity, subtotal, created_at
```

### Pembayaran
- Upload bukti bayar manual (reuse sistem yang sudah ada)
- Admin/Shop Admin verifikasi dan update status

### Stok
- Trigger database: stok berkurang saat status = `paid`, kembali saat `cancelled`

---

## 6. Tahap Implementasi

1. **Tahap 1** - Database: migration (tabel, enum, RLS, triggers, storage bucket)
2. **Tahap 2** - Types + hooks + admin panel (CRUD produk & kategori)
3. **Tahap 3** - User shop (browse, detail, keranjang)
4. **Tahap 4** - Checkout + order management + riwayat pesanan
5. **Tahap 5** - Shop dashboard statistik untuk admin

