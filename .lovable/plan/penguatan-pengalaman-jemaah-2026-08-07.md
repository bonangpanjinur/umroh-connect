# Penguatan Pengalaman Jemaah

Fokus: sisi jemaah masih berhenti di "pilih paket → booking → bayar". Setelah booking dikonfirmasi, jemaah nyaris tidak punya informasi apa pun di aplikasi.

## Temuan (terverifikasi di kode & database)

1. **Tidak ada halaman data manifest untuk jemaah.** Kebijakan akses "Jamaah can view own manifest" sudah ada di tabel `manifest_pilgrims`, tetapi tabel itu hanya dipakai di `useManifest.ts` (dashboard travel). Jemaah tidak bisa melihat/melengkapi data paspor, nomor kamar, atau status verifikasinya.
2. **Jemaah tidak bisa membatalkan booking sendiri.** Pada tabel `bookings` hanya agen/admin punya izin UPDATE dan DELETE. Tidak ada alur pengajuan pembatalan dari sisi jemaah.
3. **Tidak ada e-voucher / dokumen perjalanan.** Pencarian di seluruh `src` tidak menemukan komponen voucher, e-ticket, atau QR booking. Jemaah tidak punya bukti berangkat yang bisa ditunjukkan.
4. **Timeline persiapan masih statis.** `JourneyTimeline.tsx` memakai daftar fase hardcoded dan `useState` lokal dengan 2 task yang di-checklist secara hardcoded — progres tidak tersimpan dan tidak mengikuti tanggal keberangkatan booking nyata.
5. **Tidak ada itinerary harian per keberangkatan.** Tabel paket hanya punya `facilities`; tidak ada struktur jadwal harian yang bisa dibaca jemaah.
6. **Status dokumen tidak transparan.** Jemaah tidak tahu apakah paspor/visa/vaksin sudah diterima travel, walaupun travel sudah punya alur approve/reject manifest beserta alasan penolakan.

## Rencana Perbaikan

### Fase 1 — Portal Booking Jemaah (prioritas tertinggi)
- Panel "Data Keberangkatan Saya" di detail booking: tarik baris manifest milik jemaah, tampilkan status verifikasi (menunggu/disetujui/ditolak) beserta alasan penolakan.
- Izinkan jemaah melengkapi/memperbaiki field data dirinya sendiri (nama paspor, nomor paspor, masa berlaku, gender, kontak darurat) selama status belum disetujui.
- Checklist dokumen dengan indikator lengkap/kurang, plus notifikasi bila ditolak travel.

### Fase 2 — Pembatalan & Perubahan oleh Jemaah
- Alur pengajuan pembatalan: jemaah mengirim permintaan + alasan, travel menyetujui/menolak; status booking tidak diubah langsung oleh jemaah.
- Tampilkan estimasi potongan sesuai aturan pembatalan berjenjang yang sudah dipakai marketplace.
- Riwayat pengajuan terlihat di detail booking dan di dashboard travel.

### Fase 3 — E-Voucher & Itinerary
- E-voucher booking (kode booking + QR) yang bisa dibuka offline dan diunduh sebagai PDF, aktif hanya untuk booking terkonfirmasi/lunas.
- Itinerary harian per keberangkatan yang diisi travel, ditampilkan sebagai timeline hari ke-1..n untuk jemaah.
- Info kamar dan teman sekamar (dari rooming list) ditampilkan hanya bila manifest sudah disetujui.

### Fase 4 — Timeline Persiapan yang Nyata
- Hubungkan timeline persiapan ke tanggal keberangkatan booking aktif, sehingga fase H-30/H-7/H-1 dihitung otomatis.
- Simpan progres checklist per pengguna, dengan fallback penyimpanan lokal untuk tamu.
- Pengingat untuk task yang jatuh tempo.

## Catatan Teknis
- Fase 1 memakai tabel `manifest_pilgrims` yang sudah ada; perlu kebijakan UPDATE terbatas untuk jemaah (hanya barisnya sendiri, hanya saat status belum `approved`) dan pemicu audit yang sudah berjalan akan mencatat perubahannya.
- Fase 2 memerlukan tabel permintaan pembatalan baru (bukan UPDATE langsung ke `bookings`) beserta izin baca/tulis yang sesuai untuk jemaah dan travel.
- Fase 3 memerlukan tabel itinerary per keberangkatan; e-voucher memakai `jspdf` yang sudah dipasang.
- Fase 4 memerlukan tabel progres checklist perjalanan per pengguna.

Sarankan mengerjakan berurutan; Fase 1 dan 2 memberi dampak terbesar bagi jemaah.
