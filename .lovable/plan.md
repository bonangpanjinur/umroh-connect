

# Rencana Perbaikan: Menu Duplikat, Kesehatan/Olahraga UX, Manasik Admin, dan Bug Fix

---

## BAGIAN A: ANALISIS MENU DUPLIKAT & REDUNDAN

### Masalah yang Ditemukan

1. **Quick Access 4 Tombol + QuickMenu = Duplikasi**
   - HomeView menampilkan 4 tombol besar (Manasik, Doa, Al-Quran, Kiblat) di baris Quick Access
   - QuickMenu grid di bawahnya juga menampilkan item yang sama: Manasik, Doa, Al-Quran, Kiblat
   - Total: 8 tombol yang mengarah ke 4 fitur yang sama

2. **`doa` vs `doaharian` ID Ganda**
   - QuickMenu menggunakan `id: 'doaharian'`, Quick Access juga `id: 'doaharian'`
   - Di `Index.tsx`, ada `case 'doa'` DAN `case 'doaharian'` -- keduanya membuka `openView('doa')`

3. **`checklist` di QuickMenu mengarah ke Manasik**
   - `case 'checklist'` di `Index.tsx` baris 143 membuka `openView('manasik')` -- membingungkan karena user ekspektasi buka checklist

### Rencana Perbaikan

- **Hapus item duplikat dari QuickMenu**: Hilangkan Manasik, Doa, Al-Quran, Kiblat dari grid QuickMenu karena sudah ada di Quick Access 4 tombol besar
- **Ubah `checklist`** agar mengarah ke tab Belajar section Persiapan, bukan ke Manasik
- **Konsolidasi ID**: Hapus `case 'doa'` yang redundan, standardkan ke `doaharian`
- **QuickMenu grid lebih ringkas**: Hanya tampilkan Tasbih, Tracker, Peta, Kalkulator, Checklist, Kurs, Jurnal, Offline (8 item = 2 baris grid-cols-4)

---

## BAGIAN B: PERBAIKAN FITUR OLAHRAGA & KESEHATAN

### Masalah UX Saat Ini

1. **OlahragaView hardcode "Ramadan"**: Label "Jenis Olahraga Ramadan" (baris 261) dan warning puasa selalu ditampilkan meskipun bukan mode Ramadan
2. **Fallback mode tidak berfungsi untuk pencatatan**: Saat menggunakan `FALLBACK_EXERCISE_TYPES` (database kosong), `handleAdd` tetap insert ke database dengan `exercise_type_id` berupa `'fallback-jalan'` yang bukan UUID valid -- pasti gagal
3. **Tidak ada empty state yang informatif untuk non-login**: Pesan hanya "Masuk untuk Tracking" tanpa preview fitur
4. **Navigasi kembali dari Kesehatan sub-tab tidak jelas**: User masuk lewat Tracker > Kesehatan > Olahraga, tapi tidak ada breadcrumb
5. **MealTrackingView**: Sepenuhnya localStorage-based, tidak ada sinkronisasi database, label "Sahur/Berbuka" muncul di luar mode Ramadan
6. **OlahragaView `timeOfDay` default `setelah_tarawih`**: Hardcode Ramadan-centric bahkan saat tidak Ramadan

### Rencana Perbaikan

**File: `src/components/habit/OlahragaView.tsx`**
- Kondisikan label dan konten berdasarkan `isRamadhanMode` prop:
  - Non-Ramadan: "Jenis Olahraga", sembunyikan warning puasa, default `timeOfDay = 'kapan_saja'`
  - Ramadan: Tampilkan seperti sekarang
- Fix fallback mode: Jika menggunakan fallback types, simpan log tanpa `exercise_type_id` (set null) atau simpan ke localStorage saja
- Tambahkan ringkasan stats yang lebih visual (ikon dan warna per intensitas)

**File: `src/components/habit/MealTrackingView.tsx`**
- Kondisikan label berdasarkan mode: Non-Ramadan tampilkan "Sarapan/Makan Siang/Makan Malam", Ramadan tampilkan "Sahur/Berbuka"

**File: `src/components/habit/IbadahHubView.tsx`**
- Tab "Kesehatan" rename menjadi context-aware: "Kesehatan" (non-Ramadan) tetap OK
- Pastikan sub-tab Olahraga dan Diet menerima `isRamadhanMode` dengan benar

---

## BAGIAN C: MANASIK ADMIN -- UPLOAD FOTO & UX

### Masalah Saat Ini

1. **Gambar hanya via URL input**: `ManasikManagement.tsx` baris 317 menggunakan `<Input placeholder="https://..."/>` untuk gambar -- admin harus paste URL eksternal
2. **Tidak ada preview gambar**: Tidak ada tampilan preview saat URL diisi
3. **Tidak ada drag-and-drop order**: Urutan langkah (`order_index`) tidak bisa diatur ulang secara visual
4. **Tidak ada kolom "Gambar" di tabel**: Tabel list hanya menampilkan #, Judul, Kategori, Audio, Status, Aksi -- tidak ada preview gambar

### Rencana Perbaikan

**File: `src/components/admin/ManasikManagement.tsx`**
- **Ganti URL input gambar dengan ImageUpload component**: Gunakan komponen `ImageUpload` yang sudah ada (`src/components/common/ImageUpload.tsx`) untuk upload ke bucket `uploads`
- **Tambahkan preview gambar**: Di form dialog, tampilkan preview gambar setelah upload
- **Tambahkan kolom gambar di tabel**: Thumbnail kecil di kolom baru antara # dan Judul
- **Tambahkan drag-and-drop reorder**: Gunakan `@dnd-kit/sortable` (sudah terinstall) untuk reorder `order_index`
- **Fix: ManasikManagement tidak ada di admin sidebar** -- Ternyata sudah ada di navGroups? Cek... Tidak, `ManasikManagement` tidak ada case di `renderContent` dan tidak ada di `navGroups`. Ini bug serius: komponen ada tapi tidak pernah dimuat di admin dashboard.

**File: `src/pages/AdminDashboard.tsx`**
- Tambahkan `{ id: 'manasik', label: 'Manasik', icon: <BookOpen /> }` ke group "Konten"
- Tambahkan `case 'manasik': return <ManasikManagement />;` di `renderContent`
- Import `ManasikManagement`

---

## BAGIAN D: ANALISIS BUG LAINNYA

| # | Severity | Bug | Lokasi | Fix |
|---|----------|-----|--------|-----|
| 1 | Kritis | ManasikManagement tidak terdaftar di AdminDashboard | `AdminDashboard.tsx` | Tambah nav item + case |
| 2 | Kritis | Fallback exercise types insert UUID invalid ke DB | `OlahragaView.tsx` | Guard: simpan ke localStorage atau set `exercise_type_id` null |
| 3 | Sedang | Label Ramadan hardcode di OlahragaView (non-Ramadan) | `OlahragaView.tsx` | Kondisikan berdasarkan `isRamadhanMode` |
| 4 | Sedang | 8 tombol duplikat di HomeView (Quick Access + QuickMenu) | `QuickMenu.tsx` | Hapus 4 item duplikat |
| 5 | Sedang | `checklist` menu mengarah ke Manasik bukan Persiapan | `Index.tsx` | Redirect ke tab Belajar |
| 6 | Ringan | MealTracking label Sahur/Berbuka di luar Ramadan | `MealTrackingView.tsx` | Kondisikan berdasarkan mode |
| 7 | Ringan | `timeOfDay` default "setelah_tarawih" di luar Ramadan | `OlahragaView.tsx` | Default "kapan_saja" |

---

## RENCANA IMPLEMENTASI

### Task 1: Hapus Menu Duplikat di HomeView & QuickMenu
- Hapus Manasik, Doa, Al-Quran, Kiblat dari `menuItems` di `QuickMenu.tsx`
- Fix `checklist` routing di `Index.tsx` agar buka tab Belajar
- Konsolidasi ID `doa`/`doaharian`

### Task 2: Tambah Manasik Management ke Admin Dashboard
- Tambah nav item dan case di `AdminDashboard.tsx`
- Import `ManasikManagement`

### Task 3: Upgrade ManasikManagement dengan Image Upload
- Ganti URL input dengan `ImageUpload` component  
- Tambah preview gambar di form dan thumbnail di tabel
- Tambah drag-and-drop reorder menggunakan `@dnd-kit/sortable`

### Task 4: Fix OlahragaView Context-Aware
- Kondisikan semua label, warning, dan default values berdasarkan `isRamadhanMode`
- Fix fallback exercise types agar tidak crash saat insert ke DB
- Fix `MealTrackingView` label berdasarkan mode

### Task 5: Polish UX Kesehatan & Olahraga
- Perbaiki empty state dengan preview fitur
- Tambah ringkasan visual yang lebih menarik
- Pastikan navigasi kembali konsisten

