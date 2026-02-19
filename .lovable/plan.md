

# PDF Tracker Kosong (Printable Offline Habit Tracker)

## Apa Ini?

Fitur untuk meng-generate PDF berupa **template tracker kosong** yang bisa dicetak dan diisi manual secara offline. Bukan laporan data yang sudah terisi, melainkan lembaran checklist/tabel kosong untuk tracking harian -- cocok untuk jamaah yang ingin tracking ibadah tanpa harus buka aplikasi.

## Jenis Template PDF

User bisa memilih kategori mana yang ingin di-print:

1. **Ibadah Tracker** -- Tabel checklist harian untuk sholat, dzikir, tilawah, dll (kolom: hari 1-30, baris: nama ibadah)
2. **Olahraga Tracker** -- Tabel log olahraga (kolom: tanggal, jenis, durasi, intensitas)
3. **Makanan Tracker** -- Tabel sahur/berbuka (kolom: tanggal, menu sahur, menu berbuka, gelas air)
4. **Sedekah Tracker** -- Tabel sedekah harian (kolom: tanggal, jenis, nominal, catatan)
5. **Tadarus / Khatam Tracker** -- Grid progress per juz (30 kotak juz) + tabel harian (surah, dari ayat, sampai ayat)
6. **All-in-One** -- Gabungan ringkas semua kategori dalam 1-2 halaman

## Kustomisasi Desain

- **Tema warna**: Hijau (default), Biru, Emas, Custom
- **Periode**: Mingguan (7 kolom) atau Bulanan (30 kolom)
- **Header**: Nama user, bulan/tahun, logo custom
- **Whitelabel**: Hapus branding "UmrohConnect", ganti dengan logo sendiri (untuk agen travel)
- **Orientasi**: Portrait atau Landscape

## Monetisasi (Premium)

- **User gratis**: Bisa preview tapi tidak bisa download (tombol terkunci, tampilkan modal upgrade)
- **User premium**: Download tanpa batas semua template
- **Whitelabel**: Tier premium khusus -- bisa upload logo sendiri dan hapus branding

## Perubahan File yang Sudah Ada

**`src/utils/generateHabitPdf.ts`** -- File ini sudah ada tapi berisi logic "laporan berisi data". Akan di-**tulis ulang total** menjadi generator template kosong:
- Fungsi `generateBlankIbadahTracker()` -- grid checklist kosong
- Fungsi `generateBlankOlahragaTracker()` -- tabel log kosong
- Fungsi `generateBlankMealTracker()` -- tabel sahur/berbuka kosong
- Fungsi `generateBlankSedekahTracker()` -- tabel sedekah kosong
- Fungsi `generateBlankTadarusTracker()` -- grid juz + tabel ayat kosong
- Fungsi `generateAllInOneTracker()` -- gabungan semua

Setiap fungsi menerima config tema, periode, header, dan whitelabel.

## File Baru

**`src/components/habit/PdfTrackerBuilder.tsx`** -- UI utama:
- Pilih jenis tracker (ibadah/olahraga/makanan/sedekah/tadarus/all-in-one)
- Pilih periode (mingguan/bulanan)
- Pilih tema warna
- Upload logo (whitelabel, premium only)
- Preview mini dari template
- Tombol "Download PDF" (gated premium)

## Integrasi

**`src/components/habit/IbadahHubView.tsx`** -- Tambahkan tombol "Cetak Tracker" (ikon Printer) di header stats card, membuka sheet/modal `PdfTrackerBuilder`

## Detail Teknis

### Struktur PDF (Contoh: Ibadah Tracker Bulanan)

```text
+--------------------------------------------------+
| [Logo]  TRACKER IBADAH - Februari 2026           |
|          Nama: _______________                    |
+--------------------------------------------------+
|              | 1 | 2 | 3 | 4 | ... | 28|         |
| Sholat Subuh |   |   |   |   |     |   |         |
| Sholat Dzuhur|   |   |   |   |     |   |         |
| Sholat Ashar |   |   |   |   |     |   |         |
| Sholat Magrib|   |   |   |   |     |   |         |
| Sholat Isya  |   |   |   |   |     |   |         |
| Tilawah      |   |   |   |   |     |   |         |
| Dzikir Pagi  |   |   |   |   |     |   |         |
| Dzikir Petang|   |   |   |   |     |   |         |
| Sedekah      |   |   |   |   |     |   |         |
| Jurnal Syukur|   |   |   |   |     |   |         |
| ...          |   |   |   |   |     |   |         |
+--------------------------------------------------+
| Catatan: _______________________________________ |
+--------------------------------------------------+
```

### Dependency

- `jspdf` -- sudah ter-install
- `html2canvas` -- sudah ter-install (tapi tidak diperlukan untuk template kosong, cukup jsPDF native)

### Urutan Implementasi

1. Tulis ulang `src/utils/generateHabitPdf.ts` -- semua fungsi generator template kosong
2. Buat `src/components/habit/PdfTrackerBuilder.tsx` -- UI builder
3. Integrasikan tombol "Cetak Tracker" di `IbadahHubView.tsx`
4. Gate fitur dengan premium check dari `useIsPremium()`

### Data Habit untuk Template

Baris-baris habit di template diambil dari daftar habit aktif user di localStorage (`habit_tracker_habits`). Jika user belum punya habit, gunakan starter pack dari `defaultHabits.ts`. User juga bisa menambah baris kosong custom sebelum generate.

