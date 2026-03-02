
# Rencana Pengembangan Komprehensif: Arah Umroh

## Visi: Pendamping Digital Ibadah Umroh Terlengkap

Menjadikan Arah Umroh sebagai aplikasi #1 yang memandu jamaah dari niat hingga selesai ibadah, sambil menjalankan bisnis marketplace yang berkelanjutan.

---

## BAGIAN A: ANALISIS BUG & PERBAIKAN

### BUG 1 (Kritis): Data Edukasi Kosong -- Tidak Ada Konten Manasik di Database
**Masalah**: Tabel `manasik_guides` kosong. Padahal ada data lengkap 6 langkah manasik di `src/data/manasikData.ts` (Ihram, Talbiyah, Tawaf, Shalat Tawaf, Sa'i, Tahallul) yang tidak pernah di-seed ke database.
**Dampak**: Halaman "Belajar Umroh" menampilkan "Belum ada panduan manasik", Progress 0%, dan kartu UmrahQuickCard selalu menunjukkan "0 dari 0 langkah".
**Perbaikan**: Buat migration SQL untuk seed 6 langkah manasik dari `manasikData.ts` ke tabel `manasik_guides` lengkap dengan doa Arab, latin, arti, dan tips.

### BUG 2 (Kritis): Data Doa Kosong
**Masalah**: Tabel `prayers` dan `prayer_categories` kemungkinan kosong. Tab "Doa-doa" di Learning Hub dan DoaView menampilkan "Belum ada doa".
**Dampak**: Fitur utama edukasi (doa umroh, doa harian, doa perjalanan) tidak berfungsi.
**Perbaikan**: Seed minimal 20 doa esensial umroh ke database beserta 4 kategori (Doa Umroh, Doa Harian, Doa Perjalanan, Doa Lainnya).

### BUG 3 (Sedang): QuickMenu `doa` Membuka Manasik, Bukan Doa
**Masalah**: Di `Index.tsx` baris 94, `case 'doa'` membuka `openView('manasik')` bukan `openView('doa')` atau mengarah ke DoaView. Ini membingungkan karena menu "Manasik" dan "Doa" mengarah ke halaman yang sama.
**Perbaikan**: Ubah `case 'doa'` agar membuka `openView('manasik')` tetap untuk manasik, dan pastikan menu QuickMenu id `doa` sebenarnya merujuk manasik (atau pisahkan keduanya).

### BUG 4 (Sedang): Tab `checklist` dan `haji` Masih Ada di TabId Tapi Tidak di BottomNav
**Masalah**: `TabId` di `types/index.ts` masih memuat `'checklist'` dan `'haji'` dan `Index.tsx` masih punya case untuk `checklist` dan `haji` di switch, tapi BottomNav sudah tidak menampilkan tab-tab ini. Jika user navigate via URL `?tab=haji`, halaman tetap muncul tapi tanpa cara kembali yang jelas.
**Perbaikan**: Bersihkan dead routes atau pastikan ada navigasi balik yang konsisten.

### BUG 5 (Ringan): FeaturedPackages Tanpa Padding di HomeView
**Masalah**: Komponen `FeaturedPackages` sudah ada padding internal (`-mx-4 px-4`), tapi `HomeView` tidak membungkusnya dalam container px-4 seperti komponen lain.
**Perbaikan**: Tambahkan wrapper `px-4` di HomeView untuk konsistensi.

### BUG 6 (Ringan): UmrahQuickCard Progress Tidak Reaktif
**Masalah**: `completedSteps` dibaca dari localStorage saat render, tapi tidak di-listen ulang saat user mencentang langkah di UmrahLearningHub. Event `storage` yang di-dispatch di LearningHub hanya bekerja cross-tab.
**Perbaikan**: Gunakan state management yang shared (misalnya custom hook dengan `useSyncExternalStore`) atau re-read localStorage saat tab "home" aktif kembali.

---

## BAGIAN B: FITUR YANG HARUS DITAMBAHKAN

### Prioritas 1: Konten Edukasi Lengkap (Core Value)

#### B1. Seed Data Manasik + Doa ke Database
- 6 langkah manasik umroh lengkap (dari `manasikData.ts`)
- 4 kategori doa: Umroh, Harian, Perjalanan, Lainnya
- 20+ doa esensial: Doa Ihram, Doa Tawaf (tiap putaran), Doa Sa'i, Doa di Multazam, Doa Naik Pesawat, Doa Safar, dll
- Data mencakup: teks Arab, transliterasi, terjemahan, sumber hadits, keutamaan

#### B2. Panduan Interaktif Step-by-Step (Upgrade ManasikView)
- Tambahkan checklist per-langkah yang disimpan ke database (untuk user login) atau localStorage
- Tambahkan quiz singkat di akhir setiap langkah ("Sudah paham?")
- Tampilkan video embed YouTube jika `video_url` tersedia
- Mode "Simulasi" -- walkthrough interaktif yang memandu urutan ibadah

#### B3. Doa dengan Audio Recitation
- Integrasikan audio player di setiap doa
- Tombol "Putar Berulang" untuk latihan hafalan
- Font Arab yang lebih besar dengan opsi zoom
- Bookmark doa favorit (simpan ke database)

### Prioritas 2: Persiapan Perjalanan (Praktis)

#### B4. Checklist Persiapan Universal (Tanpa Login)
- Saat ini Checklist dikunci FeatureLock (butuh booking). Buat versi dasar yang bisa diakses semua orang
- Template checklist: Dokumen (paspor, visa, tiket), Pakaian (ihram, sehari-hari), Obat-obatan, Perlengkapan ibadah
- Checklist yang bisa dicentang dan tersimpan lokal

#### B5. FAQ & Tips Perjalanan
- Halaman FAQ terstruktur: Sebelum Berangkat, Di Tanah Suci, Setelah Pulang
- Tips cuaca, mata uang, adat istiadat
- Bisa diakses dari tab Belajar sebagai sub-section

### Prioritas 3: Pengalaman Marketplace yang Lebih Baik

#### B6. Paket Umroh -- Perbandingan Side-by-Side
- Fitur "Bandingkan Paket" (max 3 paket) untuk membandingkan hotel, harga, fasilitas
- Tombol "Bandingkan" di PackageCard

#### B7. Testimoni & Review yang Lebih Menonjol
- Tampilkan review jamaah langsung di halaman paket (bukan di halaman terpisah)
- Rating bintang di PackageCard
- Badge "Terpercaya" untuk travel dengan review > 4.5

### Prioritas 4: Engagement & Retensi

#### B8. Notifikasi Pengingat Ibadah
- Reminder harian untuk melanjutkan belajar manasik
- Pengingat sholat yang bisa dikustomisasi
- Notifikasi countdown menjelang keberangkatan

#### B9. Gamifikasi Progress Belajar
- Badge/achievement saat menyelesaikan semua langkah manasik
- Level: Pemula > Siap > Mahir
- Shareable certificate "Saya Siap Umroh"

---

## BAGIAN C: PERBAIKAN LAYOUT & UX

### C1. Restrukturisasi HomeView (Beranda)

Layout saat ini sudah cukup baik setelah perubahan sebelumnya. Perbaikan tambahan:

```text
Urutan Baru:
1. Waktu Sholat (tetap)
2. UmrahQuickCard -- perbesar, tampilkan progress nyata
3. Quick Access: 4 tombol besar (Manasik | Doa | Quran | Kiblat)
4. Banner "Mulai Persiapan" (jika belum booking)
   ATAU Countdown Keberangkatan (jika sudah booking)
5. Quick Menu (sisanya)
6. Paket Unggulan
7. Banner Promo
```

**Perubahan spesifik:**
- UmrahQuickCard diperbesar: tampilkan langkah terakhir yang dipelajari, bukan hanya angka
- Quick Access 4 tombol besar dipisahkan dari QuickMenu grid agar lebih menonjol
- Hilangkan duplikasi: Manasik dan Doa sudah ada di Quick Access, hapus dari QuickMenu grid

### C2. Perbaikan Tab Belajar (UmrahLearningHub)

Layout saat ini:
```text
Header > Progress Card > Tabs (Tata Cara | Doa | Quran) > Persiapan Lainnya
```

Perbaikan:
```text
Header > Progress Card > Tabs (Tata Cara | Doa | Quran | Persiapan) > 
  Tab Tata Cara: Langkah + Checklist interaktif
  Tab Doa: Kategori + Pencarian + Bookmark
  Tab Quran: Progress Khatam + Lanjut Baca
  Tab Persiapan: Checklist universal + FAQ + Tips + Kalkulator
```

- Gabungkan "Persiapan Lainnya" ke dalam tab ke-4 agar tidak terasa terpisah
- Tambahkan indikator progress per-tab (misal: "4/6 langkah", "12 doa dipelajari")

### C3. Navigasi & Flow yang Lebih Intuitif

- Saat user klik langkah manasik di LearningHub, langsung buka ManasikView di langkah tersebut (pass index)
- Saat user klik doa di LearningHub, buka DoaView dengan filter kategori yang sesuai
- Back button dari ManasikView/DoaView kembali ke tab yang benar di LearningHub

---

## BAGIAN D: RENCANA IMPLEMENTASI BERTAHAP

### Fase 1: Fondasi Konten (Paling Kritikal)
| No | Task | File | Estimasi |
|----|------|------|----------|
| 1 | Seed 6 langkah manasik ke database | SQL migration | Kecil |
| 2 | Seed 4 kategori + 20 doa ke database | SQL migration | Kecil |
| 3 | Fix QuickMenu routing (doa vs manasik) | `Index.tsx` | Kecil |
| 4 | Fix UmrahQuickCard reactivity | `UmrahQuickCard.tsx` | Kecil |
| 5 | Bersihkan dead TabId routes | `types/index.ts`, `Index.tsx` | Kecil |

### Fase 2: Peningkatan UX Edukasi
| No | Task | File | Estimasi |
|----|------|------|----------|
| 6 | Tambah tab "Persiapan" di LearningHub | `UmrahLearningHub.tsx` | Sedang |
| 7 | Checklist universal tanpa login | Komponen baru `BasicChecklist.tsx` | Sedang |
| 8 | Bookmark doa favorit | `DoaView.tsx`, hook baru | Sedang |
| 9 | Quick Access 4 tombol di HomeView | `HomeView.tsx` | Kecil |

### Fase 3: Konten & Engagement
| No | Task | File | Estimasi |
|----|------|------|----------|
| 10 | FAQ & Tips Perjalanan | Komponen baru | Sedang |
| 11 | Gamifikasi + badge | Hook + komponen baru | Besar |
| 12 | Perbandingan paket | `PaketView.tsx` | Besar |

### Fase 4: Polish & Optimasi
| No | Task | File | Estimasi |
|----|------|------|----------|
| 13 | Deep link dari LearningHub ke ManasikView | `UmrahLearningHub.tsx`, `Index.tsx` | Sedang |
| 14 | Review terintegrasi di PackageCard | `PackageCard.tsx` | Sedang |
| 15 | Notifikasi pengingat belajar | Edge function + hook | Besar |

---

## Ringkasan Prioritas

**Harus segera (Fase 1):** Seed data manasik & doa, fix routing bugs -- tanpa ini, fitur inti aplikasi (edukasi umroh) tidak berfungsi sama sekali.

**Penting (Fase 2):** Checklist universal, bookmark doa, perbaikan layout -- meningkatkan nilai guna harian aplikasi.

**Nilai tambah (Fase 3-4):** Gamifikasi, perbandingan paket, deep linking -- diferensiasi dari kompetitor.
