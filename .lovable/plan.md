
# Mega Kalkulator Islami + Penyempurnaan UX Tracker Ramadhan

## Ringkasan

Mengubah menu "Kalkulator" dari hanya kalkulator umroh menjadi **Hub Kalkulator Islami** dengan 8 sub-kalkulator, serta memperbaiki UX Tracker agar **Ramadhan-first** karena sedang bulan Ramadhan. Semua data disimpan di localStorage (gratis), dengan ajakan upgrade yang natural dan tidak mengganggu.

---

## Bagian 1: Hub Kalkulator Islami

### Arsitektur Baru

Menu "Kalkulator" di Quick Menu akan membuka halaman hub berisi grid sub-menu kalkulator:

**Kategori Ibadah:**
1. **Kalkulator Khatam Qur'an** (sudah ada, dipindah ke sini + tambah mode preset)
   - Mode custom (pilih tanggal)
   - Mode 1 Juz/hari (30 hari)
   - Mode cepat 10 hari
   - Mode I'tikaf 7 hari
   - Target per waktu sholat (bagi bacaan ke 5 waktu)
2. **Kalkulator Qadha Puasa** (baru)
   - Input: total hutang puasa, target selesai dalam X hari
   - Output: estimasi tanggal selesai, jadwal puasa per minggu
3. **Kalkulator Fidyah** (baru)
   - Input: jumlah hari tidak puasa, harga makanan/hari
   - Output: total fidyah yang harus dibayar
4. **Kalkulator Zakat** (baru)
   - Zakat penghasilan (2.5% dari penghasilan)
   - Zakat emas/perak
   - Zakat fitrah

**Kategori Keuangan Islami:**
5. **Kalkulator Biaya Umroh** (sudah ada, tetap di sini)
6. **Kalkulator Tabungan Haji** (baru)
   - Input: target biaya haji, tabungan/bulan
   - Output: estimasi tahun tercapai
7. **Kalkulator Cicilan Tanpa Riba** (baru)
   - Input: harga barang, DP, tenor, margin
   - Output: total bayar, cicilan/bulan
8. **Kalkulator Emas Syariah** (baru)
   - Input: harga emas, target beli, simulasi cicilan

### File Baru
- `src/components/calculator/CalculatorHub.tsx` -- Grid menu semua kalkulator
- `src/components/calculator/KhatamCalculatorFull.tsx` -- Kalkulator khatam versi lengkap dengan mode preset
- `src/components/calculator/QadhaPuasaCalculator.tsx` -- Kalkulator qadha puasa
- `src/components/calculator/FidyahCalculator.tsx` -- Kalkulator fidyah
- `src/components/calculator/ZakatCalculator.tsx` -- Kalkulator zakat (penghasilan, emas, fitrah)
- `src/components/calculator/TabunganHajiCalculator.tsx` -- Kalkulator tabungan haji
- `src/components/calculator/CicilanSyariahCalculator.tsx` -- Kalkulator cicilan tanpa riba
- `src/components/calculator/EmasSyariahCalculator.tsx` -- Kalkulator emas syariah

### File yang Dimodifikasi
- `src/pages/Index.tsx` -- Ganti `showSavings` handler agar membuka `CalculatorHub` bukan langsung `SavingsCalculatorView`
- `src/components/home/QuickMenu.tsx` -- Update label dari "Kalkulator" menjadi tetap "Kalkulator" tapi audioLabel menjadi "Kalkulator Islami"

---

## Bagian 2: Penyempurnaan UX Tracker (Ramadhan-First)

### Perubahan Utama

**A. Auto-Activate Ramadhan Mode**
- Karena sekarang bulan Ramadhan (17 Feb - 18 Mar 2026), mode Ramadhan harus **aktif otomatis** saat pertama kali dibuka
- Ubah default `isRamadhanMode` di `IbadahHubView.tsx`: deteksi tanggal saat ini, jika dalam range Ramadhan maka otomatis true
- Tetap bisa dimatikan manual

**B. Restruktur Tab Ramadhan-First**
- Saat mode Ramadhan aktif, urutan tab berubah: **Ramadan | Ibadah | Makan | Sedekah**
- Tab "Ramadan" menjadi tab pertama yang aktif saat mode Ramadhan on
- Dashboard Ramadhan tidak memerlukan login (tampilkan versi lokal untuk yang belum login)

**C. Dashboard Ramadhan Tanpa Login**
- Buat versi lokal `RamadhanDashboard` yang bisa berjalan tanpa auth
- Tampilkan: hari ke-berapa Ramadhan, countdown ke Idul Fitri, jadwal imsakiyah link, motivasi harian
- Data ibadah diambil dari localStorage

**D. Upgrade CTA yang Natural**
- Hapus `StorageIndicator` yang terlalu teknis ("localStorage 45% terpakai")
- Ganti dengan CTA yang value-driven:
  - "Simpan progress ke cloud agar tidak hilang" (muncul setelah 7 hari aktif)
  - "Lihat statistik lengkap Ramadhan Anda" (di dashboard Ramadhan)
  - Badge "PRO" kecil di fitur premium, bukan pop-up besar

**E. Iftar Countdown**
- Tambahkan countdown ke waktu berbuka puasa di header Stats Card saat Ramadhan mode aktif
- Menggunakan data prayer times yang sudah ada (`usePrayerTimes`)

**F. Quick Actions Ramadhan**
- Di bawah Stats Card, tampilkan quick action buttons: "Sudah Sahur", "Sudah Berbuka", "Tarawih", "Tadarus"
- Satu tap untuk log tanpa harus masuk ke sub-menu

### File yang Dimodifikasi
- `src/components/habit/IbadahHubView.tsx`
  - Auto-detect Ramadhan mode
  - Reorder tabs saat Ramadhan
  - Ganti StorageIndicator dengan CTA natural
  - Tambah iftar countdown
  - Tambah quick actions
- `src/components/habit/RamadhanDashboard.tsx`
  - Buat bisa berfungsi tanpa login (versi localStorage)
  - Tambah countdown Idul Fitri
  - Tambah motivasi harian yang lebih kaya
- `src/hooks/useRamadhanDashboard.ts`
  - Tambah fungsi helper untuk cek apakah dalam bulan Ramadhan
  - Export `isCurrentlyRamadan()` untuk auto-detect

---

## Bagian 3: Detail Teknis

### Semua kalkulator baru menggunakan localStorage
Tidak perlu database migration. Semua kalkulasi bersifat client-side murni.

### Struktur localStorage keys baru:
- `qadha_puasa_data` -- data hutang puasa
- `fidyah_calc` -- data kalkulasi fidyah
- `zakat_calc` -- data kalkulasi zakat
- `tabungan_haji_goal` -- target tabungan haji
- `cicilan_syariah_data` -- data simulasi cicilan
- `emas_syariah_data` -- data simulasi emas
- `ramadhan_quick_actions` -- log quick actions harian

### Khatam Calculator Enhancement
KhatamCalculator yang sudah ada di TadarusView tetap, tapi versi lengkap di CalculatorHub punya tambahan:
- 4 mode preset (1 juz/hari, 10 hari, 7 hari i'tikaf, per waktu sholat)
- Tabel breakdown bacaan per waktu sholat (Subuh: 4 halaman, Dzuhur: 4 halaman, dst)
- Disimpan di localStorage key `khatam_calculator_preset`

### Flow Navigasi Baru

```text
Quick Menu "Kalkulator"
  |
  v
CalculatorHub (grid 2x4 icon menu)
  |-- Khatam Quran (mode preset + custom)
  |-- Qadha Puasa
  |-- Fidyah
  |-- Zakat
  |-- Biaya Umroh (existing SavingsCalculatorView)
  |-- Tabungan Haji
  |-- Cicilan Syariah
  |-- Emas Syariah
```

### Urutan Implementasi
1. `CalculatorHub.tsx` -- container hub
2. 6 kalkulator baru (Qadha, Fidyah, Zakat, Haji, Cicilan, Emas)
3. `KhatamCalculatorFull.tsx` -- versi lengkap dengan mode preset
4. Update `Index.tsx` -- routing
5. Update `IbadahHubView.tsx` -- Ramadhan-first UX
6. Update `RamadhanDashboard.tsx` -- versi tanpa login + countdown
7. Update `useRamadhanDashboard.ts` -- helper auto-detect
