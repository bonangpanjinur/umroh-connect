# Penguatan UX Ibadah Harian

Aplikasi sudah kaya fitur (waktu salat, adzan, Quran + last read, tasbih, tracker habit, doa, jurnal, kalkulator), tapi alur harian masih terpecah: pengguna harus masuk ke banyak menu untuk menyelesaikan rutinitas satu hari.

## Temuan (terverifikasi di kode)

1. **Tidak ada check-in salat 5 waktu langsung.** Salat hanya ada sebagai habit hitungan (`sholat-waktu`, target 5) di `src/data/defaultHabits.ts`, tidak terhubung ke kartu waktu salat. Tidak ada tanda salat mana yang sudah/belum dikerjakan, dan tidak ada catatan qadha.
2. **Home tidak menampilkan progres ibadah hari ini.** `HomeView.tsx` hanya memuat kartu salat, doa harian, promo, paket, dan timeline perjalanan — streak dan ringkasan habit hanya ada di dalam `IbadahHubView`.
3. **Rutinitas harian tidak dituntun.** Tidak ada satu alur "hari ini" (Subuh → dzikir pagi → tilawah → dzikir sore → tidur) — semua terpisah di menu berbeda.
4. **Dzikir pagi/petang belum ada sebagai sesi terpandu.** Ada tasbih dan doa harian, tapi tidak ada paket dzikir ma'tsurat pagi/petang yang bisa dijalankan berurutan dengan hitungan otomatis.
5. **Adzan hanya notifikasi teks.** `useAdzanNotifications.ts` menjadwalkan notifikasi tapi tidak ada suara adzan/beep, tidak ada pengingat "sudah salat?" setelah waktu masuk.
6. **Al-Quran belum mendukung kebiasaan harian.** Ada last read, tapi tidak ada bookmark banyak ayat, target harian ("baca 1 halaman"), atau lanjut-otomatis dengan pengingat.
7. **Menu terlalu banyak setara.** `QuickMenu` menampilkan 12+ ikon dengan bobot sama; menu ibadah harian bersaing dengan Shop, Kurs, dan Checklist perjalanan.
8. **Tidak ada rekap mingguan/bulanan yang bisa dilihat cepat.** `WeeklySummaryCard` ada di dalam hub, tanpa laporan bulanan atau bagi-hasil (share) capaian.

## Rencana Perbaikan

### Fase 1 — Kartu "Ibadah Hari Ini" di Home (dampak terbesar)
- Perluas `PrayerTimeCard` dengan check-in per salat: 5 tombol Subuh–Isya, tandai selesai, tersimpan per tanggal (akun + fallback lokal untuk tamu).
- Tambahkan kartu ringkas di Home: streak berjalan, progres habit hari ini, tilawah terakhir, dzikir tersisa — satu tap ke masing-masing fitur.
- Salat yang terlewat masuk daftar qadha ringan (opsional, tanpa nada menghakimi).

### Fase 2 — Alur Rutinitas Terpandu
- Mode "Rutinitas Harian": urutan kontekstual sesuai jam (pagi: dzikir pagi + tilawah; malam: dzikir petang, muhasabah jurnal).
- Sesi dzikir pagi/petang terpandu: Arab → latin → terjemah, hitungan otomatis, lanjut ke dzikir berikutnya, dan sinkron ke tracker.

### Fase 3 — Pengingat yang Lebih Manusiawi
- Suara adzan/beep opsional per salat, plus pengingat lanjutan "sudah salat?" beberapa menit setelah waktu masuk.
- Pengingat target tilawah harian dan dzikir petang, mengikuti preferensi notifikasi yang sudah ada.

### Fase 4 — Quran Sebagai Kebiasaan
- Target tilawah harian (halaman/ayat) dengan progres dan otomatis lanjut dari last read.
- Bookmark banyak ayat + catatan singkat per ayat.

### Fase 5 — Penyederhanaan Navigasi & Rekap
- Susun ulang `QuickMenu`: baris utama khusus ibadah harian, menu perjalanan/belanja dipisah ke grup sekunder.
- Rekap bulanan ibadah dengan kalender heatmap dan tombol bagikan capaian.

## Catatan Teknis
- Fase 1 butuh tabel log salat harian (per pengguna, per tanggal, per salat) dengan RLS `auth.uid()` dan fallback localStorage untuk tamu, mengikuti pola `useJourneyProgress`/`useLocalHabitStorage`.
- Check-in salat disinkronkan ke habit `sholat-waktu` agar tidak ada penghitungan ganda.
- Fase 2 memakai data dzikir baru (tabel atau data statis) dan menulis ke tracking dzikir yang sudah ada.
- Fase 3 memperluas `useAdzanNotifications` (aset audio + jadwal pengingat kedua), tanpa mengubah panel preferensi notifikasi yang sudah ada.
- Fase 4 butuh kolom target harian pada data Quran pengguna dan tabel bookmark ayat.

Saran urutan: Fase 1 → 2 → 3; keduanya pertama sudah mengubah aplikasi dari "kumpulan alat" menjadi pendamping ibadah harian.
