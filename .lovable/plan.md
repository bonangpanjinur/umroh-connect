

# Analisis Bug & Kekurangan — Rencana Perbaikan

---

## BUG YANG DITEMUKAN

### 1. Riwayat Pesanan & Wishlist dari Akun — Routing Rusak
**Lokasi:** `AkunView.tsx` baris 476 & 499
**Masalah:** Navigate ke `/?view=shop&shopTab=orders` dan `/?view=shop&shopTab=wishlist`, tapi `ShopView` **tidak membaca** param `shopTab`. Artinya user selalu masuk ke tab "Produk" — bukan Orders/Wishlist.
**Perbaikan:** ShopView harus baca `shopTab` dari URL params dan set `activeTab` saat mount.

### 2. ProductRatingBadge — Label "Terjual" Salah
**Lokasi:** `ProductRatingBadge.tsx` baris 18
**Masalah:** Menampilkan `Terjual {count}` tapi `count` sebenarnya adalah jumlah **review**, bukan jumlah terjual. Menyesatkan user.
**Perbaikan:** Ubah label menjadi `{count} ulasan` atau tambah query `sold_count` terpisah.

### 3. Service Worker Error (Console)
**Masalah:** `SecurityError: Failed to register a ServiceWorker` — script di-redirect. Ini terjadi di environment preview Lovable dan **bukan bug production**. Tidak perlu diperbaiki.

### 4. UmrahQuickCard Duplikasi Tombol dengan Quick Access
**Lokasi:** `UmrahQuickCard.tsx` baris 21-25
**Masalah:** Menampilkan 3 tombol (Doa, Kiblat, Tasbih) yang sudah ada di Quick Access grid tepat di atasnya (Doa & Kiblat). User melihat tombol "Doa" dan "Kiblat" dua kali.
**Perbaikan:** Hapus quickActions dari UmrahQuickCard karena sudah ada di Quick Access.

### 5. `/?tab=haji` Route Tidak Dihandle
**Lokasi:** `AkunView.tsx` baris 40 — HajiRegistrationButton navigate ke `/?tab=haji`
**Masalah:** `TabId` hanya punya `home | belajar | paket | shop | akun`. Tidak ada `haji`. Navigasi ini **tidak melakukan apa-apa**.
**Perbaikan:** Arahkan ke view yang benar atau buat handler di Index.tsx.

---

## KEKURANGAN UI/UX

### 6. Home Screen Terlalu Panjang — Terlalu Banyak Section
Urutan sekarang: PrayerTime → Ramadan Banner → Countdown → UmrahQuickCard → Quick Access (4 tombol) → DailyDoaCard → QuickMenu (8 tombol) → FeaturedPackages → PromoBanner → Timeline.

**Masalah:** 10+ section vertikal. User harus scroll sangat jauh untuk melihat paket/promo.
**Perbaikan:** Gabungkan UmrahQuickCard ke dalam Quick Access section. Pindahkan PromoBanner ke atas (sebelum QuickMenu).

### 7. AkunView Tidak Ada Scroll Indicator
867 baris JSX, semua konten vertikal tanpa section collapse. User mungkin tidak tahu ada opsi di bawah.

---

## RENCANA IMPLEMENTASI

| # | File | Perubahan |
|---|------|-----------|
| 1 | `src/components/shop/ShopView.tsx` | Baca `shopTab` dari URL params, set `activeTab` dan `showOrders` sesuai |
| 2 | `src/components/shop/ProductRatingBadge.tsx` | Ubah `Terjual {count}` → `{count} ulasan` |
| 3 | `src/components/home/UmrahQuickCard.tsx` | Hapus quickActions row (Doa/Kiblat/Tasbih) — hanya tampilkan progress + tombol "Lanjut" |
| 4 | `src/components/home/HomeView.tsx` | Pindah PromoBanner ke atas QuickMenu; reorder sections |
| 5 | `src/components/akun/AkunView.tsx` | Fix HajiRegistrationButton: navigate ke view yang valid |
| 6 | `src/pages/Index.tsx` | Tambah handler untuk `haji` di handleMenuClick → arahkan ke tab belajar atau view dedicated |

### Detail Fix #1 — ShopView shopTab:
```typescript
// Di ShopView, tambah useEffect:
useEffect(() => {
  const shopTab = urlSearchParams.get('shopTab');
  if (shopTab === 'orders') setShowOrders(true);
  else if (shopTab === 'wishlist') setActiveTab('wishlist');
}, []);
```

### Detail Fix #3 — UmrahQuickCard tanpa duplikat tombol:
Hapus quickActions array dan render-nya. Card hanya tampilkan: judul "Belajar Umroh" + progress bar + tombol "Lanjut".

### Detail Fix #4 — Reorder HomeView:
```
PrayerTime → Ramadan Banner → Countdown → PromoBanner → Quick Access → DailyDoaCard → UmrahQuickCard → QuickMenu → FeaturedPackages → Timeline
```

