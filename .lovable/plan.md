

# Laporan Bug & Rencana Perbaikan

## Bug yang Ditemukan

### BUG 1 (Kritis): Trigger `notify_new_order` Tidak Terpasang

Fungsi database `notify_new_order()` sudah dibuat, tetapi **tidak ada trigger yang menghubungkannya** ke tabel `shop_orders`. Akibatnya, seller **tidak pernah mendapat notifikasi** saat pesanan baru dibuat.

Trigger `trg_order_status_notify` (untuk perubahan status) sudah terpasang dengan benar, tetapi trigger untuk INSERT pesanan baru tidak ada.

**Perbaikan:** Buat trigger `AFTER INSERT ON shop_orders` yang memanggil `notify_new_order()`.

---

### BUG 2 (Sedang): Duplikat Produk Tidak Berfungsi dengan Benar

Di `SellerDashboard.tsx` (baris 237-246), logika duplikat produk menggunakan `setTimeout` untuk men-set `editingProduct` setelah `setShowProductForm(true)`. Masalahnya:

1. `setShowProductForm(true)` memicu render form kosong
2. `setTimeout` kemudian men-set `editingProduct` yang memicu `useEffect` di `SellerProductForm`
3. Tapi kondisi render di baris 73 cek `showProductForm || editingProduct` -- ketika `editingProduct` di-set via setTimeout, komponen sudah di-mount dengan form kosong, dan `useEffect` di SellerProductForm hanya trigger saat `product` berubah

Secara teknis ini bisa race-condition. Cara yang lebih aman: langsung set `editingProduct` dengan data duplikat (id dihapus) tanpa perlu `setTimeout`.

**Perbaikan:** Ganti logika duplikat: langsung set `editingProduct` dengan objek produk yang sudah dihapus ID-nya, tanpa `setShowProductForm(true)` karena kondisi `editingProduct` di baris 73 sudah cukup.

---

### BUG 3 (Rendah): `ChatNotificationBell` Tersembunyi Saat Tidak Ada Notifikasi

Di `ChatNotificationBell.tsx` baris 22, komponen return `null` jika `unreadCount === 0`. Ini menyebabkan ikon lonceng chat **menghilang sepenuhnya** dari header saat tidak ada pesan baru, membuat UI tidak konsisten (lonceng order selalu tampil, lonceng chat muncul/hilang).

**Perbaikan:** Selalu tampilkan ikon, hanya sembunyikan badge angka jika `unreadCount === 0`.

---

### BUG 4 (Sedang): `useSellerChatList` Salah Mengidentifikasi Buyer

Di `useShopChat.ts` baris 178-184, ketika pesan pertama di konversasi dikirim oleh seller, `buyerId` menjadi `null`, sehingga `bId` fallback ke `msg.sender_id` yang merupakan **seller sendiri**. Ini menyebabkan:
- Nama buyer salah (menampilkan nama seller)
- Conversation key bisa tumpang tindih

**Perbaikan:** Kumpulkan mapping buyer per conversation key dari semua pesan buyer terlebih dahulu, lalu gunakan saat membangun konversasi.

---

### BUG 5 (Rendah): `onKeyPress` Deprecated

Di `ShopChatView.tsx` baris 282, menggunakan `onKeyPress` yang sudah deprecated. Seharusnya `onKeyDown`.

**Perbaikan:** Ganti `onKeyPress` menjadi `onKeyDown`.

---

### BUG 6 (Sedang): Pembatalan Pesanan Tidak Mengembalikan Stok

Di `OrderHistoryView.tsx` baris 60-76, buyer bisa membatalkan pesanan `pending`, tetapi trigger `update_shop_stock` hanya mengembalikan stok jika status sebelumnya `paid` atau `processing`. Pesanan `pending` yang dibatalkan **tidak masalah untuk stok** (karena stok belum dikurangi saat pending), tetapi logikanya bisa membingungkan jika kedepannya ada alur yang berbeda.

Status: **Bukan bug aktif** saat ini karena stok hanya berkurang saat `pending -> paid`. Tidak perlu perbaikan.

---

## Rencana Perbaikan

### 1. Migration SQL: Buat Trigger `notify_new_order`
- Tambah trigger `AFTER INSERT ON public.shop_orders` yang memanggil `notify_new_order()`
- Ini akan memperbaiki notifikasi pesanan baru untuk seller

### 2. Perbaiki Logika Duplikat Produk (`SellerDashboard.tsx`)
- Hapus `setTimeout` hack
- Langsung set `editingProduct` dengan data produk yang sudah dihapus ID-nya
- Tidak perlu `setShowProductForm(true)` karena `editingProduct` sudah cukup untuk memicu render form

### 3. Perbaiki `ChatNotificationBell.tsx`
- Hapus early return `null` saat `unreadCount === 0`
- Selalu render ikon bell, hanya tampilkan badge angka saat ada pesan belum dibaca

### 4. Perbaiki Identifikasi Buyer di `useShopChat.ts`
- Ubah logika grouping konversasi agar selalu mengidentifikasi buyer dengan benar, bahkan ketika pesan pertama berasal dari seller

### 5. Ganti `onKeyPress` dengan `onKeyDown` di `ShopChatView.tsx`

### Detail Teknis

| File | Perubahan |
|------|-----------|
| Migration SQL baru | `CREATE TRIGGER trg_new_order_notify AFTER INSERT ON shop_orders FOR EACH ROW EXECUTE FUNCTION notify_new_order()` |
| `src/pages/SellerDashboard.tsx` | Perbaiki logika duplikat produk (baris 237-246) |
| `src/components/shop/ChatNotificationBell.tsx` | Hapus early return null (baris 22) |
| `src/hooks/useShopChat.ts` | Perbaiki identifikasi buyer di `useSellerChatList` |
| `src/components/shop/ShopChatView.tsx` | `onKeyPress` -> `onKeyDown` |

