

# Analisis Bug, Kekurangan & Rencana Perbaikan

---

## A. BUG YANG DITEMUKAN

### 1. FeaturedPackages Tidak Punya Padding Horizontal
**Lokasi:** `FeaturedPackages.tsx` baris 36
**Masalah:** Component dibungkus `<div className="space-y-3">` tanpa `px-4`. Akibatnya judul "Paket Unggulan" menempel ke tepi kiri layar. Bandingkan dengan PromoBanner dan DailyDoaCard yang pakai `px-4`.
**Perbaikan:** Tambah `px-4` pada wrapper div.

### 2. `closeView` Menghapus Semua URL Params
**Lokasi:** `Index.tsx` baris 78-80
**Masalah:** `closeView` memanggil `setSearchParams({})` yang menghapus **semua** search params termasuk `tab`. Jika user buka view dari tab Shop (`/?tab=shop&view=orders`), menutup view akan reset ke home — bukan kembali ke Shop.
**Perbaikan:** `closeView` harus preserve param `tab` yang ada sebelumnya.

### 3. `handleTabChange` Menghapus `view` Param — Tapi Tidak Reset State
**Lokasi:** `Index.tsx` baris 65-72
**Masalah:** Saat user klik menu "Shop" dari QuickMenu, `handleTabChange('shop')` dipanggil. Ini set params ke `{tab: 'shop'}` — yang menghapus `view` param. Tapi jika sebelumnya ada `activeView`, state URL sudah berubah namun `renderView()` masih cek `activeView` lebih dulu. Bisa terjadi race condition di mana view lama masih tampil sesaat.

### 4. Splash Screen Selalu Tampil 2 Detik — Tidak Ada Skip
**Lokasi:** `App.tsx` baris 78-89
**Masalah:** Setiap kali buka app, user **wajib** tunggu 2 detik splash screen. Untuk returning user ini mengganggu. Tidak ada cara skip atau cek apakah sudah pernah tampil.
**Perbaikan:** Tampilkan splash hanya pada first visit (cek `sessionStorage`), atau kurangi durasi ke 1 detik dengan fade-out.

### 5. Profile `avatar_url` Update Pakai `as any` Type Cast
**Lokasi:** `AkunView.tsx` baris 304
**Masalah:** `await supabase.from('profiles').update({ avatar_url: avatarUrl } as any)` — type cast `as any` menandakan kolom `avatar_url` mungkin tidak ada di Supabase types. Ini menyembunyikan error.
**Perbaikan:** Pastikan kolom `avatar_url` ada di database schema dan types ter-generate dengan benar.

---

## B. FITUR KURANG BAGUS / TIDAK BERGUNA

### 1. Journey Timeline — Terlalu Kompleks, Jarang Terlihat
**Masalah:** 314 baris kode, tapi hanya tampil jika user punya `hasActiveBooking`. Mayoritas user (belum booking) tidak pernah lihat. Dan posisinya di **paling bawah** home screen.
**Saran:** Pindahkan ke tab Belajar atau halaman booking detail. Bukan di home.

### 2. Ramadan Mode Toggle di Header — Tidak Kontekstual
**Masalah:** Tombol Ramadan mode ada di header **sepanjang tahun**. Di luar Ramadan, fitur ini membingungkan. User awam tidak tahu fungsinya.
**Saran:** Sembunyikan tombol di luar bulan Ramadan (auto-detect), atau pindahkan ke Pengaturan di Akun.

### 3. SOS Button di Header — Jarang Dipakai Sehari-hari
**Masalah:** Tombol SOS (emergency) selalu tampil di header. Fitur ini hanya relevan saat user **sedang di Arab Saudi**. Di Indonesia, tombol ini waste of space.
**Saran:** Tampilkan SOS hanya saat user punya booking aktif dengan departure < 30 hari, atau saat geolocation detect di Arab Saudi.

### 4. UmrahQuickCard di Home — Kurang Informatif
**Masalah:** Card hanya menampilkan progress bar manasik. Tapi progress selalu 0 jika user belum pernah buka manasik. Card terasa "dead" tanpa motivasi.
**Saran:** Tampilkan tip singkat atau judul langkah berikutnya, bukan hanya "0 dari X langkah".

---

## C. KEKURANGAN

### 1. Tidak Ada Empty State yang Baik
- FeaturedPackages return `null` jika kosong — home screen langsung loncat ke section berikutnya
- PromoBanner return `null` jika tidak ada banner — home screen terasa "bolong"
- Seharusnya ada placeholder atau CTA (misal: "Hubungi agen untuk promo terbaru")

### 2. Tidak Ada Error Boundary
Seluruh app tidak punya error boundary. Jika satu component crash (misal API error), seluruh halaman blank.

### 3. Tidak Ada Pull-to-Refresh
Home screen tidak support pull-to-refresh. User harus reload browser untuk refresh data.

### 4. Navigasi Kembali Tidak Konsisten
- Beberapa view pakai `onBack` callback → `closeView()` 
- Beberapa pakai `navigate('/')` langsung
- Sheet di AkunView pakai manual `setShow...(false)` — tidak support Android back button

### 5. AkunView Terlalu Panjang (881 Baris)
Semua settings, sheets, modals ada di satu file. Sulit di-maintain.

---

## D. RENCANA PERBAIKAN (PRIORITAS)

| # | Perbaikan | File | Effort |
|---|-----------|------|--------|
| 1 | Fix FeaturedPackages padding (`px-4`) | `FeaturedPackages.tsx` | Kecil |
| 2 | Fix `closeView` agar preserve `tab` param | `Index.tsx` | Kecil |
| 3 | Splash screen: skip jika bukan first visit (`sessionStorage`) | `App.tsx` | Kecil |
| 4 | Sembunyikan tombol Ramadan di header jika bukan bulan Ramadan — pindah ke Akun > Pengaturan | `AppHeader.tsx`, `AkunView.tsx` | Sedang |
| 5 | SOS hanya tampil saat ada booking aktif (departure < 30 hari) | `AppHeader.tsx` | Sedang |
| 6 | UmrahQuickCard: tampilkan judul langkah berikutnya + motivasi | `UmrahQuickCard.tsx` | Kecil |
| 7 | Tambah Error Boundary wrapper di App level | `App.tsx`, new `ErrorBoundary.tsx` | Sedang |
| 8 | Empty state untuk FeaturedPackages dan PromoBanner | `FeaturedPackages.tsx`, `PromoBanner.tsx` | Kecil |

### Detail Implementasi

**Fix #2 — closeView preserve tab:**
```typescript
const closeView = useCallback(() => {
  const currentTab = searchParams.get('tab');
  if (currentTab) {
    setSearchParams({ tab: currentTab });
  } else {
    setSearchParams({});
  }
}, [setSearchParams, searchParams]);
```

**Fix #3 — Splash screen skip:**
```typescript
const [showSplash, setShowSplash] = useState(() => {
  if (sessionStorage.getItem('splash_shown')) return false;
  sessionStorage.setItem('splash_shown', 'true');
  return true;
});
```

**Fix #4 — Ramadan toggle conditional:**
```typescript
// Hanya tampilkan di header saat bulan Ramadan (auto-detect) atau jika sudah aktif
const isRamadanSeason = /* detect via Hijri calendar or config */;
// Jika bukan musim Ramadan, sembunyikan dari header, tampilkan di Akun saja
```

**Fix #5 — SOS conditional:**
```typescript
// Di AppHeader, terima prop hasActiveBooking
// Hanya render SOS button jika hasActiveBooking === true
```

**Fix #6 — UmrahQuickCard next step:**
```typescript
const nextGuide = guides.find(g => !completedSteps.includes(g.id));
// Tampilkan: "Langkah berikutnya: {nextGuide?.title}"
```

**Fix #7 — Error Boundary:**
```typescript
// Buat src/components/common/ErrorBoundary.tsx
// Wrap di App.tsx: <ErrorBoundary><AppContent /></ErrorBoundary>
// Tampilkan UI friendly: "Terjadi kesalahan. Silakan muat ulang."
```

### Urutan Implementasi:
1. Fix #1, #2, #3 (bug fix cepat)
2. Fix #6, #8 (UX improvement ringan)
3. Fix #4, #5 (header cleanup)
4. Fix #7 (error boundary)

