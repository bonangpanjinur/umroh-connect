# Analisis Bug & Roadmap Pengembangan

Hasil audit cepat terhadap kode yang ada (modul agen, paket, booking, shop, hooks). Saya bagi jadi dua bagian: **(A) Bug & utang teknis** dan **(B) Gap fitur (bisnis + kenyamanan jamaah)**, masing-masing dengan rencana perbaikan/pengembangan bertingkat prioritas.

---

## A. Bug & Utang Teknis

### A1. Bug fungsional (prioritas tinggi)

1. **Audit log paket — RLS terlalu ketat untuk insert**
   - Kebijakan `INSERT WITH CHECK (false)` di `departure_audit_log` aman, tapi karena trigger pakai `SECURITY DEFINER`, sebagian environment (Postgres dengan `nosuperuser`) bisa menolak. Perlu validasi via test booking nyata.

2. **Cascade `closed → cancelled` tidak menggulung kembali**
   - Saat agen membuka kembali paket dari `closed` ke `active`, departures tetap `cancelled`. Tidak ada mekanisme rollback / restore. Banyak agen akan kebingungan.

3. **Trigger `notify_departure_low_seats` bisa spam**
   - Threshold 70% & 90% diperiksa per perubahan `available_seats`. Kalau seat balik naik (cancel booking) lalu turun lagi, notifikasi terkirim ulang. Perlu state per-departure ("last_threshold_notified").

4. **`enforce_active_package_on_booking` memblokir update non-status**
   - Trigger `BEFORE INSERT` saja, jadi ok untuk insert. Tapi update booking (mis. ubah jumlah jamaah) ke paket yang sudah `closed` tidak diblokir → potensi bug bisnis.

5. **`updateDeparture` menerima `as any` di `PackageQuotaDetail`**
   - Cast `{ id, status: target } as any` melemahkan typing, perlu mutation bertipe ketat. Mudah kelewat error runtime.

6. **Service Worker error di preview**
   - `SecurityError: script resource is behind a redirect` dari `dev-sw.js`. Hanya muncul di preview Lovable; perlu guard `import.meta.env.DEV` agar tidak mendaftarkan SW di iframe preview.

7. **React Router v6 deprecation warnings**
   - `v7_startTransition` & `v7_relativeSplatPath`. Bukan blocker, tapi perlu opt-in agar bersih.

8. **`as any` & `error: any` tersebar luas**
   - 80+ titik di `useAgentData.ts`, `useBookings.ts`, dll. Risiko silent failure. Perlu narrowing bertahap dengan tipe `Database` dari `types.ts`.

9. **Tidak ada error boundary global**
   - Crash di salah satu modal (mis. PDF export gagal load `jspdf`) membuat seluruh dashboard putih.

10. **PDF/Excel export mem-block UI**
    - `await import('xlsx')` di-trigger sinkron tanpa loading state pada tombol — user mungkin double-click → multi-download.

### A2. Performa & UX

11. Realtime subscription `useDeparturesRealtime` dibuat di tiap modal yang dibuka — channel berkali-kali kalau modal ditutup-buka. Belum ada de-dup.
12. Daftar paket di dashboard belum pagination → jika agen punya 100+ paket, render lambat.
13. Tidak ada skeleton loader konsisten — beberapa list pakai spinner, lainnya kosong.
14. Audit log ditarik tanpa pagination (limit 100). Untuk paket aktif lama akan miss data lama.
15. Filter di dashboard paket belum di-persist ke URL (`?status=draft`) — refresh me-reset filter.

### A3. Keamanan

16. Banyak `SECURITY DEFINER` function executable oleh anon (linter WARN). Audit & batasi `EXECUTE` ke `authenticated`.
17. Storage bucket public membolehkan listing (linter WARN) — sudah di memory RLS hardening, tapi 4 bucket masih kena.
18. Tidak ada rate-limit di sisi DB untuk insert booking — bot bisa spam.

### Rencana perbaikan (bertingkat)

**Sprint 1 — Stabilitas inti (1–2 hari)**
- Fix SW dev (skip register di iframe), aktifkan future flags React Router.
- Tambah `ErrorBoundary` di `App.tsx` & per modal besar.
- Disable tombol export saat mutation/loading; tampilkan spinner.
- Tipe-kuatkan `useUpdateDeparture` & hilangkan `as any` di `PackageQuotaDetail`.

**Sprint 2 — Logika bisnis paket (2–3 hari)**
- Migrasi: tambah kolom `last_low_seats_threshold` di `departures` agar notifikasi tidak spam.
- Migrasi: trigger `BEFORE UPDATE` di `bookings` reuse `enforce_active_package_on_booking`.
- Migrasi: function `restore_package_departures(package_id)` untuk rollback cancel saat reopen.
- Persist filter status paket ke URL (`?status=`).
- Pagination + infinite scroll di audit log dan daftar paket.

**Sprint 3 — Keamanan & kebersihan (1–2 hari)**
- `REVOKE EXECUTE ... FROM anon` untuk semua SECURITY DEFINER non-public.
- Storage policy: hanya owner yang bisa `LIST` bucket privat, public bucket pakai `name LIKE 'public/%'`.
- DB-level rate limit insert booking per `auth.uid()` (function `check_booking_rate`).
- Bersihkan `as any` di hooks utama (5 file paling sering dipakai).

---

## B. Gap Fitur — Bisnis & Kenyamanan Jamaah

Saya kelompokkan jadi **B1 Operasional Travel**, **B2 Pengalaman Jamaah**, **B3 Monetisasi & Pertumbuhan**, **B4 Compliance**.

### B1. Operasional Travel (Agen)

| Fitur | Manfaat | Status |
|---|---|---|
| **Manifest jamaah per keberangkatan** (export PDF/Excel: nama, paspor, no kursi, kamar, bus) | Wajib untuk imigrasi, muassasah, hotel rooming list | belum ada |
| **Rooming list otomatis** (pasangan/keluarga, mahram detection) | Hemat 2–3 jam per group | belum |
| **Pembagian bus/grup** (drag & drop ke koper warna) | Standar travel umroh | belum |
| **Reminder pelunasan otomatis** (H-30/H-14/H-7 via WA/email) | Cashflow agen | edge function `payment-reminders` ada, tapi tidak terhubung UI |
| **Refund/cancellation tracking** | Audit & laporan keuangan | belum |
| **Komisi sales / referral agent** | Insentif tim sales | belum |
| **Multi-staff per travel** (peran: sales, finance, ops) | Travel besar butuh delegasi | role-only, belum ada `travel_members` |
| **Dashboard cashflow** (nilai DP, pelunasan due, refund, net revenue per bulan) | Decision making | sebagian di analytics |
| **Bulk import paket / import CSV jamaah** | Setup awal cepat | belum |
| **Template kontrak & invoice PDF whitelabel** | Profesionalisme | hanya tracker PDF |

### B2. Pengalaman Jamaah

| Fitur | Manfaat |
|---|---|
| **E-ticket / e-voucher digital** (QR code masuk hotel, absensi keberangkatan) | sudah ada booking_code, perlu QR + halaman publik |
| **Itinerary harian per jamaah** (jadwal ziarah, makan, manasik) terintegrasi prayer times | hooks `useImportantLocations` ada, belum jadi itinerary |
| **Live group tracking + roll call** (sudah ada `GroupTracking`, tapi belum absensi titik-temu) | Anti-tertinggal |
| **Chat group per keberangkatan** (broadcast pengumuman + 2-way) | sekarang chat hanya 1-1 buyer-seller |
| **Notifikasi adzan otomatis berdasar lokasi GPS** (sudah ada base) — perlu offline fallback di Saudi |
| **Hafalan doa progres** + reminder doa per fase manasik | sudah ada Memorization |
| **Form keluhan / lost & found in-trip** | jamaah lansia sering hilang barang |
| **Health check-in harian** (suhu, kelelahan) → notif ke ops | musim haji panas |
| **Buku catatan rohani / journal** | sudah ada |
| **Ringkasan perjalanan post-trip** (foto, statistik, sertifikat umroh PDF) | retention & word-of-mouth |
| **Mode lansia: font besar, voice guidance** | sebagian via Elderly Mode |
| **Penerjemah Arab cepat (kategori: hotel, makan, darurat)** | belum |

### B3. Monetisasi & Pertumbuhan

| Fitur | Manfaat |
|---|---|
| **Marketplace add-ons** (kursi pesawat, upgrade hotel, ziarah optional) per booking | revenue per jamaah +15-30% |
| **Cicilan tanpa kartu kredit (tabungan umroh)** | sudah ada savings calculator, perlu rekening virtual & autodebet |
| **Affiliate jamaah** (kode referral diskon) | growth organik |
| **Public review & rating travel** | ada partial — perlu moderation queue |
| **Featured slot berbayar** | ada `FeaturedPackageManager`, perlu rotasi otomatis & analytics |
| **Iklan in-feed shop / sponsored package** | belum |
| **Subscription premium jamaah** (offline maps, journal cloud, family sharing) | sebagian |
| **Voucher & promo code** (early bird, group of 4) | belum |
| **Lead capture WhatsApp click-to-chat ke agen** | partial via inquiry |
| **Analytics ke agen: konversi, sumber traffic, drop-off checkout** | partial |

### B4. Compliance & Trust

- **Verifikasi izin Kemenag (PPIU/PIHK)** dengan badge resmi → upload SK, expiry tracking.
- **Sertifikat akreditasi & asuransi perjalanan** ditampilkan di profil agen.
- **Pernyataan harga transparan** (breakdown: visa, tiket, hotel, handling).
- **Audit trail** untuk admin platform (log siapa publish/close paket — sebagian sudah).
- **Privasi data paspor** — enkripsi at rest, akses log.

### Rencana Pengembangan (4 fase, 8–10 minggu)

```text
Fase 1: Operasional Inti (3 minggu)
 ├─ Manifest jamaah + rooming list + bus group export
 ├─ Reminder pelunasan UI (terhubung edge function)
 ├─ Multi-staff travel (role: owner, ops, finance, sales)
 └─ Dashboard cashflow (revenue/refund/due)

Fase 2: Pengalaman Trip (2 minggu)
 ├─ E-voucher QR + halaman publik
 ├─ Itinerary harian per departure
 ├─ Group chat per departure (broadcast + 2-way)
 └─ Roll call + lost-and-found

Fase 3: Monetisasi (2 minggu)
 ├─ Marketplace add-ons per booking
 ├─ Voucher / promo code engine
 ├─ Affiliate code jamaah
 └─ Featured rotation + analytics

Fase 4: Trust & Compliance (1 minggu)
 ├─ Verifikasi Kemenag badge + dokumen expiry
 ├─ Harga breakdown transparan
 └─ Privacy hardening data paspor
```

---

## Catatan Teknis (untuk dev)

- Gunakan kolom baru `departures.last_low_seats_threshold` (text NULL) untuk de-dup notifikasi.
- Manifest export: bikin view materialized `departure_manifest` join `bookings + profiles + passport_data`.
- Group chat per departure: tambah `chat_threads` dengan `kind='departure_group'` + `departure_id`.
- E-voucher QR: HMAC `booking_code + secret`, page `/voucher/:code`, scan endpoint untuk roll call.
- Multi-staff: tabel `travel_members(travel_id, user_id, role)` + helper `is_travel_member(_uid,_tid,_role)` mirip `owns_travel`.
- Cashflow dashboard: SQL view `agent_cashflow_monthly`.

---

## Yang Saya Sarankan Mulai Lebih Dulu

1. **Sprint 1 bug fixes** (½–1 hari) — quick wins, hilangkan SW error & error boundary.
2. **Manifest jamaah + reminder pelunasan UI** — paling sering diminta agen.
3. **E-voucher QR + roll call** — pembeda kompetitif & langsung berdampak ke jamaah.

Konfirmasi mau mulai dari mana, atau saya gabung **Sprint 1 + Manifest jamaah** sebagai paket pertama?
