

# Rencana Perbaikan: Duplikat Menu, UI/UX, Fitur & Bug

---

## 1. DUPLIKAT MENU DI HALAMAN AKUN

**Masalah ditemukan:**
- **Admin Dashboard** muncul **2 kali** (baris 360 dan 539) — satu merah, satu ungu
- **Shop Admin** muncul **2 kali** (baris 410 dan 514) — satu ungu, satu emerald

**Perbaikan:**
- Hapus duplikat Admin Dashboard kedua (baris 538-561)
- Hapus duplikat Shop Admin kedua (baris 513-536)
- Susun urutan dashboard: Admin → Agent → Shop Admin → Seller → Booking → Haji → Riwayat Pesanan → Wishlist
- Kelompokkan dengan section header "Dashboard" dan "Aktivitas Saya"

---

## 2. UI/UX — DAILY DOA CARD TERLALU PANJANG

**Masalah:** Card menampilkan judul + teks Arab + transliterasi + terjemahan + kategori sekaligus. Pada doa panjang, card bisa memakan 40-50% layar.

**Perbaikan:**
- Batasi tinggi card dengan `max-h-[180px]` dan overflow hidden
- Teks Arab: batasi 2 baris (`line-clamp-2`)
- Transliterasi: batasi 1 baris (`line-clamp-1`)
- Terjemahan: batasi 2 baris (`line-clamp-2`)
- Tambah tombol "Selengkapnya" yang expand card jika user ingin baca lengkap
- Kurangi padding dan margin agar lebih compact

---

## 3. ANALISIS FITUR — PENINGKATAN PRIORITAS

| Fitur | Status | Peningkatan |
|-------|--------|-------------|
| **Checklist Persiapan** | Redirect ke Ibadah Hub (salah konteks) | Buat checklist dedicated atau redirect ke Learning Hub tab "Persiapan" |
| **QuickMenu "Checklist"** | `onMenuClick('checklist')` → buka Ibadah Hub | Seharusnya buka Learning Hub karena checklist = persiapan umroh |
| **Ramadan Menu di QuickMenu** | Duplikat dengan Quick Access (Doa, Kiblat, Manasik, Quran) | Saat Ramadan mode, QuickMenu sudah menampilkan Doa/Kiblat/Manasik/Quran yang juga ada di Quick Access — perlu deduplikasi |
| **Shop search pre-fill** | Sudah diimplementasi di Index.tsx | Pastikan ShopView benar-benar membaca `searchParams.get('search')` saat mount |
| **UmrahQuickCard** | Selalu tampil meski user sudah belajar | Bisa disembunyikan setelah user pernah klik "Mulai Belajar" |

**Perbaikan yang akan dilakukan:**
- Fix `checklist` menu → arahkan ke tab Belajar (bukan Ibadah)
- Deduplikasi ramadanMenuItems: hapus item yang sudah ada di Quick Access
- UmrahQuickCard: tambah dismiss/hide capability via localStorage

---

## 4. ANALISIS BUG

| Bug | Lokasi | Dampak |
|-----|--------|--------|
| **Duplikat Admin Dashboard** | `AkunView.tsx` baris 360 & 539 | User bingung, 2 tombol ke halaman sama |
| **Duplikat Shop Admin** | `AkunView.tsx` baris 410 & 514 | User bingung, 2 tombol ke halaman sama |
| **Checklist → Ibadah Hub** | `Index.tsx` baris ~138 `case 'checklist': openView('ibadah')` | Checklist persiapan umroh seharusnya bukan tracker ibadah |
| **Riwayat Pesanan navigate** | `AkunView.tsx` baris 471 `navigate('/?tab=shop&view=orders')` | URL format `tab=shop&view=orders` tidak dihandle di Index.tsx — view dan tab bersamaan bisa konflik |
| **Wishlist navigate** | `AkunView.tsx` baris 494 `navigate('/?tab=shop&view=wishlist')` | Sama — `view=wishlist` tidak ada di `FULLSCREEN_VIEWS` |

**Perbaikan:**
- Fix navigasi Riwayat Pesanan & Wishlist: gunakan format yang konsisten dengan routing di Index.tsx
- Fix checklist routing ke tab belajar
- Hapus semua duplikat di AkunView

---

## 5. IMPLEMENTASI TEKNIS

### File yang diubah:

| File | Perubahan |
|------|-----------|
| `src/components/akun/AkunView.tsx` | Hapus duplikat Admin Dashboard & Shop Admin; kelompokkan menu dengan section headers |
| `src/components/home/DailyDoaCard.tsx` | Tambah line-clamp, max-height, tombol "Selengkapnya" |
| `src/components/home/QuickMenu.tsx` | Deduplikasi ramadanMenuItems (hapus Doa, Kiblat, Manasik, Quran yang sudah di Quick Access) |
| `src/pages/Index.tsx` | Fix `checklist` case → `handleTabChange('belajar')` |

### Urutan:
1. Fix duplikat menu Akun (bug kritis UX)
2. Compact DailyDoaCard (UI improvement)
3. Fix routing bugs (checklist, order history, wishlist)
4. Deduplikasi QuickMenu saat Ramadan mode

