# Review Kekurangan: Fitur, Bug, dan Rencana Perbaikan

Hasil audit kode + database live (4 paket, 9 keberangkatan, 3 travel, 0 booking, 0 order — jadi banyak alur transaksi belum pernah teruji dengan data nyata).

---

## 1. Kekurangan Fitur

### A. Untuk Jemaah
| Kekurangan | Dampak |
|---|---|
| Tidak ada e-voucher / e-ticket (QR) untuk booking | Jemaah tak punya bukti digital saat check-in hotel/bandara |
| Tidak ada itinerary harian per keberangkatan | Jemaah tidak tahu jadwal ziarah/manasik harian |
| Chat masih 1-1 saja, belum ada grup per keberangkatan | Pengumuman travel harus dikirim manual satu-satu |
| Tidak ada riwayat pembayaran & jadwal cicilan yang terlihat jemaah | Bingung sisa tagihan; `payment_schedules` ada di DB tapi belum tampil |
| Tidak ada roll call / absensi titik temu di Group Tracking | Risiko jemaah tertinggal |
| Tidak ada lost & found / form keluhan saat perjalanan | Keluhan lari ke WhatsApp pribadi |
| Tidak ada ringkasan pasca-perjalanan (sertifikat/statistik) | Kehilangan momen retensi & promosi mulut ke mulut |
| Belum ada penerjemah frasa Arab praktis | Kesulitan komunikasi dasar di Saudi |

### B. Untuk Travel / Agen
| Kekurangan | Dampak |
|---|---|
| Tidak ada manifest jemaah per keberangkatan (nama, paspor, kursi, kamar) | Wajib untuk imigrasi & hotel; sekarang harus ketik ulang manual |
| Tidak ada rooming list & pembagian bus/grup | Pekerjaan manual 2–3 jam per grup |
| Reminder pelunasan jalan otomatis via cron, tapi **tanpa panel kontrol di dashboard** | Agen tak bisa lihat siapa sudah/belum ditagih, tak bisa kirim manual |
| Tidak ada pencatatan refund / pembatalan | Laporan keuangan tidak lengkap |
| Tidak ada multi-staff per travel (ops, finance, sales) | Semua akses lewat 1 akun pemilik |
| Tidak ada dashboard cashflow (DP masuk, pelunasan jatuh tempo, refund) | Sulit ambil keputusan bisnis |
| Tidak ada template invoice/kontrak PDF berlogo travel | Kesan kurang profesional |
| Tidak ada import massal jemaah/paket (CSV) | Setup awal lambat |

### C. Untuk Admin Platform
| Kekurangan | Dampak |
|---|---|
| Tidak ada verifikasi izin Kemenag (PPIU/PIHK) + masa berlaku | Travel tidak terverifikasi bisa jualan; kepercayaan rendah |
| Tidak ada moderation queue terpusat untuk review & konten | Review palsu/spam lolos |
| Tidak ada audit trail aksi admin (siapa suspend travel, ubah setting) | Tidak bisa dipertanggungjawabkan |
| Tidak ada monitoring kesehatan sistem (log cron, gagal notifikasi, error edge function) | Kegagalan reminder tidak terdeteksi |
| Tidak ada engine voucher/promo & laporan komisi platform | Sumber monetisasi belum tergarap |

---

## 2. Bug & Masalah yang Ditemukan

**Terverifikasi dari kode/DB:**

1. **Cron reminder pelunasan terdaftar dua kali** — job `payment-reminders-daily` (00:00) dan `daily-payment-reminders` (02:00) memanggil fungsi yang sama. Jemaah berpotensi menerima pengingat pelunasan dobel setiap hari.
2. **Status `dp_paid` tidak ada di database** — `useJamaahAccess` memfilter `status in ('pending','confirmed','paid','dp_paid')` padahal kolom/status itu tidak ada di tabel `bookings` (hanya `haji_registrations` punya `dp_paid_at`). Akibatnya jemaah yang baru bayar DP tidak dihitung "confirmed" sehingga fitur perjalanan (SOS, timeline) bisa tidak terbuka.
3. **Peran `super_admin` fantom** — `AppRole` di TypeScript memuat `super_admin`, sedangkan enum `app_role` di database tidak. `isAdmin()` memeriksa peran yang tidak mungkin ada; kalau ada kode yang mengandalkan itu akan selalu gagal.
4. **Anon key tertanam di command cron** — token dikirim sebagai Authorization di 4 cron job. Bekerja, tapi pemanggilan fungsi reminder ini terbuka (`verify_jwt = false`) sehingga siapa pun bisa memicu blast reminder.
5. **Semua edge function `verify_jwt = false`** (11 fungsi di `config.toml`) — termasuk `send-push-notification`, `send-whatsapp-reminder`, `create-payment`. Validasi harus dilakukan di dalam fungsi; perlu dipastikan tiap fungsi benar-benar memverifikasi pemanggil.
6. **Alur transaksi belum pernah teruji** — 0 booking dan 0 order di database. Trigger `enforce_active_package_on_booking`, `update_booking_paid_amount`, cascade `closed → cancelled`, dan notifikasi seat belum terbukti jalan end-to-end.
7. **Utang tipe (`as any`, `error: any`) masih tersebar** di hooks besar (`useAgentData`, `useBookings`, dll.) — risiko kegagalan senyap.
8. **Belum ada pagination** di daftar paket dashboard dan beberapa list admin — lambat jika data bertambah.
9. **4 bucket publik masih mengizinkan listing** (`travel-logos`, `package-images`, `prayer-audio`, `shop-images`) — isi bucket bisa dienumerasi.

---

## 3. Rencana Perbaikan Bertahap

### Fase 1 — Stabilkan & Uji Alur Inti (2–3 hari)
- Hapus cron `payment-reminders-daily` yang duplikat, sisakan satu jadwal.
- Rapikan status booking: samakan tipe TypeScript dengan enum database; ganti pemakaian `dp_paid` dengan cek `paid_amount > 0`.
- Hapus `super_admin` dari `AppRole` (atau tambahkan ke enum database bila memang ingin dipakai) dan rapikan `isAdmin()`.
- Uji end-to-end satu siklus penuh: buat paket → jadwal → booking → DP → pelunasan → tutup paket, sambil memeriksa trigger dan notifikasi.
- Audit tiap edge function: pastikan ada verifikasi pemanggil (secret header atau JWT) untuk fungsi yang mengirim notifikasi/pembayaran.

### Fase 2 — Operasional Travel (2 minggu)
- **Manifest jemaah per keberangkatan** + ekspor Excel/PDF (nama, paspor, kontak, kursi, kamar).
- **Rooming list & pembagian bus** sederhana (drag & drop, deteksi mahram/keluarga).
- **Panel reminder pelunasan** di dashboard agen: daftar tagihan jatuh tempo, riwayat pengiriman, tombol kirim manual.
- **Pencatatan refund/pembatalan** + dashboard cashflow bulanan (DP, pelunasan, refund, net).
- **Invoice & kontrak PDF berlogo travel**.

### Fase 3 — Pengalaman Jemaah (2 minggu)
- **E-voucher QR** + halaman publik `/voucher/:code` dan endpoint scan untuk roll call.
- **Itinerary harian per keberangkatan**, terhubung jadwal salat & lokasi penting.
- **Chat grup per keberangkatan** (broadcast pengumuman + balasan).
- **Halaman pembayaran jemaah**: sisa tagihan, jadwal cicilan, riwayat bukti bayar.
- **Lost & found / form keluhan** in-trip.

### Fase 4 — Kepercayaan & Admin (1 minggu)
- **Verifikasi izin Kemenag** (upload SK, tanggal kedaluwarsa, badge terverifikasi).
- **Moderation queue** review & konten untuk admin.
- **Audit trail aksi admin** + halaman monitoring cron/notifikasi gagal.
- Tutup listing pada 4 bucket publik (izinkan baca objek, tolak enumerasi).

### Fase 5 — Monetisasi (1–2 minggu)
- Engine **voucher & promo** (early bird, grup 4 orang).
- **Add-on per booking** (upgrade hotel, kursi pesawat, ziarah opsional).
- **Kode referral jemaah** + laporan komisi.
- Rotasi otomatis + analitik untuk slot Featured berbayar.

---

## Catatan Teknis
- Manifest: view `departure_manifest` join `bookings + profiles`, ekspor lewat SheetJS/jsPDF yang sudah dipakai di Detail Kuota.
- E-voucher: HMAC `booking_code + secret`, tabel scan log untuk roll call.
- Multi-staff: tabel `travel_members(travel_id, user_id, role)` + helper `is_travel_member()` mengikuti pola `owns_travel()`.
- Cashflow: view `agent_cashflow_monthly` agregasi `bookings.paid_amount` per bulan.
- Hapus cron duplikat dengan `cron.unschedule('payment-reminders-daily')`.

---

## Saran Urutan Mulai
1. **Fase 1** dulu — murah, menghilangkan reminder dobel dan bug akses jemaah pasca-DP.
2. **Manifest + panel reminder pelunasan** — paling sering diminta travel.
3. **E-voucher QR + roll call** — pembeda kompetitif yang langsung dirasakan jemaah.
