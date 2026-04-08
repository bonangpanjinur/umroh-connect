

# Analisis Bug — Rencana Perbaikan

---

## Bug yang Ditemukan

### 1. FeaturedPackages Loading State Tidak Punya Padding
**Lokasi:** `FeaturedPackages.tsx` baris 17-28
**Masalah:** Saat loading, wrapper div menggunakan `<div className="space-y-3">` tanpa `px-4`. Padahal saat data sudah tampil (baris 36), sudah ada `px-4`. Ini menyebabkan skeleton loading menempel ke tepi layar.
**Perbaikan:** Tambah `px-4` pada loading state wrapper.

### 2. `openView` Menghapus `tab` Param
**Lokasi:** `Index.tsx` baris 74-76
**Masalah:** `openView` memanggil `setSearchParams({ view, ...params })` yang menghapus `tab` param. Jadi jika user di tab Shop lalu buka view, param `tab=shop` hilang. Saat `closeView` dipanggil, `searchParams.get('tab')` return null — user kembali ke home bukan ke Shop.
**Perbaikan:** `openView` harus preserve `tab` param yang ada.

### 3. Seller Dashboard Tampil untuk Admin Tanpa Seller Profile
**Lokasi:** `AkunView.tsx` baris 435
**Masalah:** Kondisi `(isSeller() || !!sellerProfile || isAdmin())` menampilkan Seller Center untuk admin meskipun admin tidak punya seller profile. Klik tombol ini akan membuka halaman kosong.
**Perbaikan:** Tampilkan hanya jika `isSeller() || !!sellerProfile`.

### 4. Profile `avatar_url` Pakai `as any` Type Cast
**Lokasi:** `AkunView.tsx` baris 304
**Masalah:** `await supabase.from('profiles').update({ avatar_url: avatarUrl } as any)` — `as any` menyembunyikan potensi error jika kolom `avatar_url` tidak ada di types.
**Perbaikan:** Kolom `avatar_url` sudah ada di database (terlihat di network response), jadi masalah ada di types yang belum ter-regenerate. Cast tetap aman untuk sekarang, tapi idealnya types harus di-update.

### 5. SOS Button Selalu Tampil — Tidak Kontekstual
**Lokasi:** `AppHeader.tsx` baris 72-81
**Masalah:** SOS selalu tampil di header untuk semua user, meskipun user tidak punya booking aktif. Untuk user biasa di Indonesia, tombol ini tidak relevan dan menghabiskan space header.
**Perbaikan:** Tampilkan SOS hanya jika user memiliki active booking, atau sembunyikan di balik menu overflow.

### 6. Duplicate Shop Rendering — Tab dan View
**Lokasi:** `Index.tsx` baris 166-168 dan 252-253
**Masalah:** ShopView bisa di-render melalui dua jalur: `activeView === 'shop'` (baris 166) dan `activeTab === 'shop'` (baris 252). Keduanya render `<ShopView>` tapi dengan `onBack` handler berbeda. Dari QuickMenu, `handleMenuClick('shop')` memanggil `handleTabChange('shop')` yang set `tab=shop`. Tapi dari AkunView, navigate ke `/?view=shop&shopTab=orders` yang set `view=shop`. Ini bisa membingungkan karena perilaku back button berbeda.

### 7. Sheets di AkunView Tidak Support Browser Back Button
**Lokasi:** `AkunView.tsx` baris 723-876
**Masalah:** 6 sheet/modal (Bookings, Notifications, Language, Theme, Profile, Background) semuanya menggunakan state boolean biasa (`showBookings`, `showNotifications`, dll). Tidak ada integrasi dengan browser history. Jika user menekan tombol back di Android, mereka keluar dari halaman — bukan menutup sheet.
**Perbaikan:** Prioritas rendah — perlu refactor signifikan untuk menggunakan URL-based state atau `popstate` listener.

---

## Rencana Implementasi (Prioritas)

| # | Fix | File | Effort |
|---|-----|------|--------|
| 1 | FeaturedPackages loading padding | `FeaturedPackages.tsx` | Kecil |
| 2 | `openView` preserve `tab` param | `Index.tsx` | Kecil |
| 3 | Seller Center hanya tampil jika ada seller profile | `AkunView.tsx` | Kecil |
| 4 | SOS button conditional (hanya saat ada booking) | `AppHeader.tsx`, `Index.tsx` | Sedang |

### Detail Fix #2 — openView preserve tab:
```typescript
const openView = useCallback((view: string, params?: Record<string, string>) => {
  const currentTab = searchParams.get('tab');
  const newParams: Record<string, string> = { view, ...params };
  if (currentTab) newParams.tab = currentTab;
  setSearchParams(newParams);
}, [setSearchParams, searchParams]);
```

### Detail Fix #3 — Seller Center conditional:
```typescript
{(isSeller() || !!sellerProfile) && (
  // Seller Center button...
)}
```

### Detail Fix #4 — SOS conditional:
AppHeader perlu menerima prop `hasActiveBooking` dari Index.tsx, lalu hanya render SOS jika `hasActiveBooking` true.

