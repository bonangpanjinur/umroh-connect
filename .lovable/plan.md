# Fase 1 — Stabilkan & Uji Alur Inti

Tujuan: menghilangkan bug terverifikasi yang berdampak langsung ke jemaah dan agen, sebelum menambah fitur baru.

## 1. Hapus cron reminder pelunasan yang duplikat
Saat ini ada dua cron job memanggil fungsi `payment-reminders` yang sama: `payment-reminders-daily` (00:00) dan `daily-payment-reminders` (02:00). Jemaah bisa menerima pengingat pelunasan dua kali sehari.

- Hapus jadwal `payment-reminders-daily`, sisakan satu jadwal harian.

## 2. Rapikan status booking (`dp_paid` tidak ada di database)
Tabel `bookings` hanya punya `status`, `paid_amount`, `remaining_amount` — tidak ada status `dp_paid` maupun kolom `dp_paid_at`. Padahal `useJamaahAccess` memfilter `status in ('pending','confirmed','paid','dp_paid')` dan menganggap booking "confirmed" jika statusnya `dp_paid`.

- Buang nilai `dp_paid` dari filter dan pengecekan di `src/hooks/useJamaahAccess.ts`.
- Ganti definisi "sudah bayar": booking dianggap terkonfirmasi jika status `confirmed`/`paid` **atau** `paid_amount > 0`, supaya jemaah yang baru bayar DP tetap mendapat akses fitur perjalanan (SOS, timeline, tracking).
- Samakan tipe `BookingStatus` di `src/hooks/useBookings.ts` dengan nilai yang benar-benar dipakai.

## 3. Bersihkan peran `super_admin` fantom
`AppRole` di `src/types/database.ts` memuat `super_admin`, sedangkan enum `app_role` di database hanya berisi `jamaah, agent, admin, shop_admin, seller`. `isAdmin()` memeriksa peran yang tidak mungkin ada.

- Hapus `super_admin` dari `AppRole` dan dari pengecekan `isAdmin()` di `src/hooks/useAuth.ts`.
- Cek pemakaian lain agar tidak ada logika yang bergantung padanya.

## 4. Perkuat verifikasi pemanggil edge function
Semua 11 edge function berjalan dengan `verify_jwt = false`, termasuk yang mengirim notifikasi dan memproses pembayaran. Fungsi reminder dipanggil cron dengan anon key, jadi siapa pun bisa memicu blast reminder.

- Tambahkan pemeriksaan header rahasia bersama (`CRON_SECRET`) pada `payment-reminders`, `departure-reminders`, dan `check-agent-notifications`; tolak permintaan tanpa header yang benar.
- Perbarui perintah cron agar menyertakan header tersebut.
- Pastikan `send-push-notification` dan `send-whatsapp-reminder` memverifikasi pemanggil (JWT pengguna atau secret internal) sebelum mengirim.

## 5. Uji satu siklus penuh secara manual
Database masih 0 booking dan 0 pesanan, jadi trigger inti belum pernah terbukti jalan.

- Jalankan skenario: buat paket draft → publish jadi aktif → buat jadwal → buat booking → catat pembayaran DP → pelunasan → tutup paket.
- Verifikasi yang harus terjadi: kode booking terisi otomatis, `paid_amount` ikut terupdate dari `payment_schedules`, notifikasi seat terkirim sekali saja, jadwal ikut dibatalkan saat paket ditutup, dan booking pada paket tertutup ditolak.
- Catat temuan; perbaikan trigger yang gagal jadi bagian fase ini.

---

## Catatan Teknis
- Cron duplikat dihapus dengan `cron.unschedule('payment-reminders-daily')`.
- `CRON_SECRET` dibuat sebagai secret proyek; cron menyertakannya sebagai header `x-cron-secret`.
- `useJamaahAccess` sebaiknya ikut menarik `paid_amount` agar tidak perlu query tambahan.

## Di luar cakupan Fase 1
Manifest jemaah, e-voucher QR, panel reminder, dashboard cashflow, dan verifikasi Kemenag masuk Fase 2–4.
