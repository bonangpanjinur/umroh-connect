
# Timeline Kondisional, Penyempurnaan Kalkulator & PDF Report Premium

## Ringkasan

Tiga area perubahan utama:
1. **Timeline Perjalanan** dibuat kondisional -- hanya muncul untuk user yang punya booking aktif, dengan toggle show/hide
2. **Penyempurnaan Kalkulator** -- ikon Tabungan Haji sudah diganti Landmark, tapi di dalam component TabunganHajiCalculator masih pakai PiggyBank, perlu diselaraskan
3. **PDF Report Builder** -- fitur premium baru untuk menghasilkan laporan PDF dari data habit tracker (ibadah, olahraga, makanan, sedekah, tadarus, khatam) dengan desain yang bisa di-custom dan whitelabel

---

## Bagian 1: Timeline Perjalanan Kondisional

### Perubahan

**File: `src/components/home/HomeView.tsx`**
- JourneyTimeline saat ini tampil untuk semua user tanpa kondisi
- Ubah agar hanya muncul jika user punya `hasActiveBooking` (sudah ada dari `useJamaahAccess`)
- Tambahkan toggle localStorage `show_journey_timeline` agar user bisa sembunyikan/munculkan
- User tanpa booking tidak melihat timeline sama sekali

### Logika

```text
Jika user login DAN punya booking aktif:
  - Cek localStorage 'show_journey_timeline' (default: true)
  - Jika true: tampilkan JourneyTimeline + tombol "Sembunyikan"
  - Jika false: tampilkan banner kecil "Lihat Timeline Perjalanan"
Jika tidak login ATAU tidak punya booking:
  - Tidak tampilkan apa-apa
```

---

## Bagian 2: Penyempurnaan Kalkulator

### Ikon Tabungan Haji

**File: `src/components/calculator/TabunganHajiCalculator.tsx`**
- Baris 5 masih import `PiggyBank` -- ganti ke `Landmark`
- PiggyBank tidak digunakan di render, jadi hanya perlu update import agar konsisten

### Analisis Menu Lain yang Perlu Disempurnakan

Setelah menganalisis seluruh kode, berikut temuan:

1. **Olahraga & Sedekah** -- keduanya membutuhkan login (menampilkan "Masuk untuk Tracking"). Ini inkonsisten dengan filosofi "data di localStorage gratis". Perlu tambahkan versi local storage agar user bisa pakai tanpa login, mirip seperti MealTrackingView yang sudah pakai localStorage.

2. **Tadarus** -- juga minta login. Perlu versi localStorage minimal agar user bisa mencatat tanpa login.

3. **PaketView filter** -- sudah cukup lengkap (price, bulan, hotel, flight, durasi, tipe paket). Tambahan sort (harga termurah/termahal, keberangkatan terdekat) akan meningkatkan UX.

---

## Bagian 3: PDF Report Builder (Fitur Premium)

### Konsep

Fitur baru bernama **"Laporan Ibadah PDF"** yang mengumpulkan semua data habit dari localStorage/database dan menghasilkan dokumen PDF yang bisa di-download. Fitur ini **premium only** -- memerlukan langganan aktif atau pembayaran terpisah.

### Konten PDF

Laporan berisi:
- **Ringkasan periode** (pilih range tanggal)
- **Statistik Ibadah** -- jumlah habit selesai, streak, rate
- **Statistik Olahraga** -- total menit, sesi, jenis terlengkap
- **Statistik Makanan** -- pola sahur/berbuka, asupan air
- **Statistik Sedekah** -- total nominal, frekuensi, jenis
- **Statistik Tadarus** -- progress khatam, total ayat, juz
- **Khatam Progress** -- persentase dan estimasi selesai
- **Grafik mingguan** (simple bar chart via canvas-to-image)

### Desain Customizable

User bisa memilih:
- **Tema warna**: Hijau, Biru, Emas, Custom
- **Header/Footer**: Nama user, logo custom (upload), tagline
- **Whitelabel**: Opsi untuk menghilangkan branding "UmrohConnect" dan menambah logo sendiri (cocok untuk agen travel yang ingin memberikan laporan ke jamaah)
- **Format**: Portrait atau landscape

### Monetisasi

- User gratis: tidak bisa akses (tombol generate terkunci)
- User premium: bisa generate tanpa batas
- Whitelabel mode: memerlukan tier "Premium" khusus atau pembayaran terpisah (admin bisa atur harga via dashboard)

### Implementasi Teknis

**File Baru:**
- `src/components/habit/PdfReportBuilder.tsx` -- UI pemilih tema, range tanggal, preview, dan tombol generate
- `src/components/habit/PdfReportPreview.tsx` -- Preview visual dari laporan sebelum di-download
- `src/utils/generateHabitPdf.ts` -- Fungsi utama untuk menghasilkan PDF menggunakan library browser-native (jsPDF atau html2canvas + jsPDF)

**File yang Dimodifikasi:**
- `src/components/habit/IbadahHubView.tsx` -- Tambahkan tombol "Laporan PDF" di header stats card atau sebagai tab/menu baru
- `src/components/premium/PremiumUpgradeModal.tsx` -- Tambahkan "Laporan PDF" sebagai salah satu selling point premium

**Dependency Baru:**
- `jspdf` -- Library untuk generate PDF di browser
- `html2canvas` -- Untuk mengkonversi element HTML ke canvas/image untuk dimasukkan ke PDF

### Alur User

```text
1. User buka Tracker -> klik ikon "PDF" / "Laporan"
2. Modal PdfReportBuilder terbuka
3. Pilih range tanggal (minggu ini, bulan ini, custom)
4. Pilih tema desain (warna, layout)
5. Upload logo (opsional, whitelabel)
6. Preview laporan
7. Klik "Download PDF"
   - Jika premium: generate & download langsung
   - Jika bukan premium: tampilkan modal upgrade
```

---

## Bagian 4: Detail Teknis

### Urutan Implementasi

1. **Timeline kondisional** -- modifikasi `HomeView.tsx` (cepat, 1 file)
2. **Fix ikon TabunganHaji** -- cleanup import di `TabunganHajiCalculator.tsx`
3. **Tambah sort di PaketView** -- opsi sorting harga dan tanggal keberangkatan
4. **Versi localStorage untuk Olahraga, Sedekah, Tadarus** -- agar bisa dipakai tanpa login
5. **Install jspdf + html2canvas** -- dependency
6. **PdfReportBuilder + generateHabitPdf** -- UI dan logic PDF
7. **Integrasi ke IbadahHubView** -- tombol akses dan gate premium

### Struktur localStorage Baru

- `show_journey_timeline` -- boolean untuk toggle timeline
- `pdf_report_theme` -- tema desain terakhir yang dipilih
- `pdf_report_logo` -- base64 logo whitelabel (jika ada)
- `local_olahraga_logs` -- data olahraga tanpa login
- `local_sedekah_logs` -- data sedekah tanpa login
- `local_tadarus_logs` -- data tadarus tanpa login

### Database (tidak ada migrasi diperlukan)

Semua data PDF report diambil dari localStorage (untuk user non-login) atau dari database yang sudah ada (untuk user login). Tidak perlu tabel baru.
