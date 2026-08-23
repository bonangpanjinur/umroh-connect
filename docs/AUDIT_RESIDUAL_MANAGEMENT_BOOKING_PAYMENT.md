# Audit Residual Frontend Management: Booking dan Payment

**Tanggal audit:** 23 Agustus 2026  
**Repository frontend:** `umroh-connect`  
**Repository Core:** `sistem-travel-umroh`  
**Ruang lingkup:** frontend management dan customer-facing flow yang berhubungan langsung dengan booking, payment, payment proof, membership, premium, notification, serta realtime booking.

## Ringkasan eksekutif

Fondasi booking utama sudah cukup baik karena `useBookings.ts` menggunakan Core API untuk membaca booking, membuat checkout, mengubah status, mengambil payment schedule, mengalokasikan pembayaran, dan membaca payment notifications. Namun, audit menemukan beberapa residual penting.

Temuan paling berisiko adalah **payment management membership/premium yang masih memiliki direct Supabase Storage, direct Supabase table mutation, dan Supabase Edge Function payment gateway**. Jalur tersebut masih dapat melewati canonical payment intent dan ownership policy Core. Pada domain booking, residual transaksi direct Supabase sudah hampir tidak ada, tetapi terdapat masalah correctness dan context: query key belum memasukkan tenant/branch context, `PaymentProofUpload` memblokir tombol submit sebelum upload, dan modal booking management belum menyediakan payment proof serta notes ketika mencatat pembayaran.

> Kesimpulan: booking transaction path sudah mendekati Core-centric, tetapi payment membership/premium dan beberapa context/query-cache issue masih berstatus **P0/P1 sebelum pilot**.

## Temuan residual direct Supabase

| Prioritas | File | Akses residual | Risiko | Status migrasi |
|---|---|---|---|---|
| P0 | `src/components/agent/AgentMembershipCard.tsx` | `supabase.storage` untuk bukti bayar dan `supabase.functions.invoke('create-payment')` untuk gateway | Payment proof berupa raw storage path, gateway tidak memakai canonical intent, sulit diaudit dan rawan bypass ownership | Belum dimigrasikan |
| P0 | `src/hooks/usePremiumSubscription.ts` | Mutation `user_subscriptions` langsung, admin read/update subscription langsung, dan update `platform_settings`/`subscription_plans` langsung | Frontend dapat melewati approval, audit, idempotency, dan platform authorization | Belum dimigrasikan |
| P0 | `src/components/premium/PremiumPaymentModal.tsx` | `supabase.storage` dan Edge Function `create-payment` | Jalur premium berbeda dari Core payment intent; proof dan gateway tidak memiliki canonical lifecycle | Belum dimigrasikan |
| P1 | `src/components/premium/PremiumUpgradeModal.tsx` | `supabase.storage` dan Edge Function `create-payment` | Duplikasi jalur payment dan kemungkinan perbedaan harga/status dengan Core | Belum dimigrasikan |
| P1 | `src/hooks/useAgentNotifications.ts` | Supabase Realtime channel dan Edge Function `check-agent-notifications` | Bukan mutation booking, tetapi notification state tidak bersumber dari Core worker/API | Belum dimigrasikan |
| P1 | `src/hooks/useWhatsAppReminder.ts` | Edge Function `send-whatsapp-reminder` | Reminder tidak berada pada command/audit Core yang canonical | Belum dimigrasikan |
| P1 | `src/hooks/useChat.ts` | Supabase Realtime channel `chat-*` | Realtime masih memakai channel legacy; perlu dipastikan ownership dan event tenant tidak bocor | Sebagian masih legacy |
| P1 | `src/hooks/useGroupTracking.ts` | Supabase Realtime channel `group-*` | Event group dapat berjalan di luar event/ownership Core | Di luar transaksi, tetapi perlu audit |
| P2 | `src/components/agent/HajiManagement.tsx` | Supabase Storage untuk media | Bukan payment mutation, tetapi masih residual pada management document/media | Belum dimigrasikan |
| P2 | `src/components/akun/AkunView.tsx` | Upload avatar dan update `profiles` langsung | Di luar booking/payment, tetapi masih direct mutation profile | Belum dimigrasikan |

## Domain booking

### Jalur yang sudah memakai Core API

`useBookings.ts` sudah menggunakan metode Core berikut:

| Fungsi frontend | Metode Core | Penilaian |
|---|---|---|
| Daftar booking jamaah | `coreApi.getMyBookings()` | Ownership customer terpusat di Core |
| Daftar booking management | `coreApi.listManagementBookings({ branchId })` | Core menjadi source of truth, tetapi nama variabel `travelId` versus `branchId` perlu diperjelas |
| Detail booking | `coreApi.getMyBooking(bookingId)` | Aman bila endpoint melakukan booking ownership join |
| Checkout | `coreApi.createCheckoutSession()` | Sudah sesuai canonical checkout dan idempotency |
| Update status management | `coreApi.updateManagementBookingStatus()` | Perlu memastikan status mutation selalu mengirim idempotency key dari Core client |
| Payment allocation | `coreApi.allocatePayment()` | Sudah memakai endpoint canonical dan mendukung schedule/proof/notes |
| Payment schedule | `listManagementPaymentSchedules()` dan `listMyPaymentSchedules()` | Sudah terpisah antara management dan customer |
| Payment proof customer | `coreApi.uploadPaymentProof()` | Core-centric, tetapi UI memiliki bug gating |
| Payment notifications | `listMyPaymentNotifications()` dan `markMyNotificationRead()` | Sudah memakai Core API |
| Payment order | `coreApi.createPaymentOrder()` | Sudah melalui Core |

### Temuan booking yang perlu diperbaiki

| Prioritas | Lokasi | Temuan | Dampak |
|---|---|---|---|
| P0 | `src/components/booking/PaymentProofUpload.tsx:227-230` | Tombol `Kirim Bukti` disabled berdasarkan `!uploadedPath`, padahal `uploadedPath` baru diisi setelah `handleSubmit()` berhasil. State yang benar sebelum submit adalah `proofPayload`. | Pengguna dapat memilih file tetapi tidak dapat mengirim bukti pembayaran pada alur pertama. |
| P1 | `src/hooks/useBookings.ts:82` | Query key user booking hanya `['bookings', 'user', user?.id]`; belum eksplisit memasukkan tenant context atau session context. | Cache lama berpotensi tampil setelah perubahan tenant/session bila cache tidak dibersihkan global. |
| P1 | `src/hooks/useBookings.ts:96` | Query key agent memakai `travelId`, sedangkan request mengirim `{ branchId: travelId }`. | Risiko salah context bila satu travel memiliki beberapa branch atau bila prop memang travel ID, bukan branch ID. |
| P1 | `src/hooks/useBookings.ts:110` | Detail booking memakai `['booking', bookingId]` tanpa tenant/branch/user scope. | Cache key dapat bentrok lintas context jika booking ID atau sesi dipakai ulang. |
| P1 | `src/components/agent/BookingDetailModal.tsx:119-144` | Status mutation menerima `agentNotes`, tetapi `useUpdateBookingStatus` hanya meneruskan `bookingId` dan `status`. | Catatan operasional dapat hilang walaupun pengguna mengisinya. |
| P1 | `src/components/agent/BookingDetailModal.tsx:133-144` | Record payment hanya menerima amount dan schedule; belum menyediakan upload/selection payment proof serta notes, meskipun hook mendukung `proofDocumentId` dan `notes`. | Histori pembayaran management kurang lengkap dan bukti pembayaran tidak terhubung dari modal operasional. |
| P1 | `src/components/agent/BookingsManagement.tsx:87-97` | Search dan status filter dilakukan setelah seluruh daftar booking dimuat. | Tidak scalable untuk tenant dengan volume booking tinggi; sebaiknya server-side search/filter dan cursor pagination. |
| P2 | `src/hooks/useBookings.ts:343-359` | Upcoming payments dihitung dari data booking yang sudah dimuat, bukan endpoint aggregate/due dashboard. | Beban payload besar dan hasil tidak lengkap bila daftar booking dipaginasi. |
| P2 | `src/hooks/useBookings.ts:363-395` | Payment stats dihitung di browser dari booking list. | Statistik dapat tidak lengkap dan tidak konsisten dengan aggregate Core pada volume besar. |

## Domain payment dan subscription

### Temuan kritis

`usePremiumSubscription.ts` hanya menggunakan Core API untuk membaca sebagian data (`listSubscriptionPlans`, `getMySubscription`, dan payment events). Mutation berikut masih direct Supabase:

1. `useCreateSubscription()` melakukan `upsert` ke `user_subscriptions` langsung dari browser.
2. `useAllSubscriptions()` membaca `user_subscriptions`, `subscription_plans`, dan `profiles` langsung dari browser.
3. `useVerifySubscription()` mengubah status subscription langsung dari browser.
4. `useSubscriptionPriceSetting()` membaca `platform_settings` langsung.
5. `useUpdateSubscriptionPrice()` mengubah `platform_settings` dan `subscription_plans` dalam dua mutation terpisah, tanpa transaction wrapper dan tanpa canonical platform-admin idempotency.

Selain itu, `AgentMembershipCard`, `PremiumPaymentModal`, dan `PremiumUpgradeModal` masih memanggil Edge Function `create-payment`. Jalur ini berbeda dari Core payment intent yang baru tersedia untuk premium dan credit. Akibatnya terdapat potensi dua source of truth untuk:

- provider payment intent;
- payment proof;
- nominal pembayaran;
- status paid/pending/rejected;
- subscription atau membership activation;
- audit dan refund/reconciliation.

### Endpoint Core yang tersedia dan gap kontraknya

| Kebutuhan | Endpoint/metode yang tersedia | Gap yang masih ada |
|---|---|---|
| Daftar subscription plan | `GET /platform/subscription-plans` | Perlu memastikan price field tidak lagi dipetakan ke model legacy `price_yearly` secara ambigu |
| Status subscription user | `GET /platform/me/subscription` dan `/platform/me/subscription/status` | Sudah tersedia |
| Premium payment events | `GET /platform/me/premium/payment-events` | Sudah tersedia |
| Premium payment intent | Backend tersedia pada `POST /platform/me/premium/payment-intents` | `coreApi.ts` belum menyediakan helper create premium payment intent yang digunakan modal |
| Premium manual proof | Belum ditemukan kontrak canonical yang mengganti `user_subscriptions.upsert` dengan `payment_proof_document_id` | Perlu endpoint payment proof/subscription request Core |
| Management membership read | `coreApi.getManagementMembership(travelId)` | Sudah tersedia |
| Management membership request | `POST /management/membership/:travelId/requests` | Client masih mengirim `payment_proof_url`, bukan private document ID |
| Management membership gateway | Belum ada helper/endpoint khusus yang dipakai `AgentMembershipCard` | Perlu `membership_payment_intents` atau kontrak reusable payment intent yang mengikat `travel_id` dan `plan_type` |
| Admin subscription list/verify | Frontend masih direct Supabase | Perlu seluruhnya melalui `/platform/admin/*` dengan authorization, Zod, transaction wrapper, idempotency, dan audit |
| Subscription price setting | Frontend masih direct Supabase | Perlu platform-admin settings endpoint atomic dengan audit log |
| Credit payment proof/gateway | Sudah dimigrasikan pada batch sebelumnya | Dapat dijadikan pola implementasi untuk membership/premium |

## Query key dan tenant context

Audit menemukan banyak query key menggunakan `user?.id`, `travelId`, atau `bookingId`, tetapi belum seluruhnya memasukkan tenant/branch context secara eksplisit. Minimal pola yang direkomendasikan:

```ts
['management', tenantId, branchId, 'bookings', filters]
['management', tenantId, branchId, 'booking', bookingId]
['customer', userId, 'booking', bookingId]
['management', tenantId, branchId, 'payment-schedules', bookingId]
['platform', actorId, 'subscription', 'all']
```

Saat tenant atau branch berubah, aplikasi harus membatalkan query context lama, membersihkan selection booking yang aktif, dan tidak mempertahankan optimistic data dari context sebelumnya.

## Prioritas remediation

| Urutan | Prioritas | Pekerjaan | Kriteria selesai |
|---:|---|---|---|
| 1 | P0 | Migrasikan `usePremiumSubscription` mutation dan admin subscription management ke Platform Admin/Core API | Tidak ada `supabase.from()` pada subscription flow; semua mutation memakai Zod, authorization, idempotency, transaction wrapper, dan audit log |
| 2 | P0 | Migrasikan `AgentMembershipCard` ke private document API dan membership payment intent Core | Tidak ada `supabase.storage` atau `functions.invoke('create-payment')`; proof memakai document ID dan gateway intent canonical |
| 3 | P0 | Perbaiki `PaymentProofUpload` | Tombol submit aktif setelah `proofPayload` tersedia, bukan setelah `uploadedPath` terisi |
| 4 | P1 | Migrasikan `PremiumPaymentModal` dan `PremiumUpgradeModal` | Keduanya menggunakan premium payment intent Core; callback/status berasal dari webhook Core, bukan callback frontend sebagai source of truth |
| 5 | P1 | Perbaiki query key booking/payment | Semua query management memuat tenant/branch; cache dibersihkan ketika context berubah |
| 6 | P1 | Lengkapi `BookingDetailModal` | `agentNotes`, payment proof, notes, dan amount dikirim ke canonical allocation endpoint |
| 7 | P1 | Server-side filter dan cursor pagination booking | Search, status, branch, dan date range dikirim ke Core; browser tidak memuat seluruh booking |
| 8 | P1 | Migrasikan notification/reminder command | `useAgentNotifications` dan `useWhatsAppReminder` menggunakan Core notification/reminder API atau worker yang diaudit |
| 9 | P1 | Audit/migrasikan chat realtime booking | Channel dan event harus tenant/booking-owned atau diganti dengan Core event/polling yang ownership-safe |
| 10 | P2 | Migrasikan avatar dan Haji management storage | Semua media memakai signed/presigned Core storage API |

## Rekomendasi implementasi tahap berikutnya

Tahap paling aman adalah melakukan batch P0 berikut secara berurutan:

1. Tambahkan endpoint Core membership payment intent dan manual membership proof dengan `payment_proof_document_id`.
2. Tambahkan helper client `createPremiumPaymentIntent`, `createManagementMembershipPaymentIntent`, dan `submitMembershipPaymentProof`.
3. Refactor `AgentMembershipCard`, `PremiumPaymentModal`, dan `PremiumUpgradeModal` agar hanya menggunakan helper Core.
4. Refactor `useCreateSubscription`, `useVerifySubscription`, `useAllSubscriptions`, dan price-setting hooks ke endpoint Platform Admin/Core.
5. Perbaiki gating `PaymentProofUpload` dan tambahkan regression test untuk alur pilih file → submit → success.
6. Setelah typecheck, jalankan static residual scan berikut:

```bash
cd /home/ubuntu/umroh-connect-work

git grep -nE "supabase\\.(from|rpc|storage)|supabase\\.functions|functions\\.invoke" -- \
  src/components/agent src/components/booking src/components/premium src/hooks
```

## Audit conclusion

Booking customer dan booking management sudah sebagian besar berada di atas Core API. Risiko transaksi booking langsung dari frontend sudah menurun signifikan. Akan tetapi, **payment subscription dan membership masih belum memenuhi kebijakan zero direct Supabase mutation/read untuk domain transaksi**. Sebelum pilot, jalur tersebut harus dipusatkan ke Core sebagaimana credit payment yang sudah dilakukan, dengan private document ID, payment intent state machine, provider webhook sebagai source of truth, idempotency canonical, audit log, dan tenant/actor ownership validation.


## Addendum: hasil perbaikan P0 dan audit domain berikutnya

### Perbaikan P0 yang telah diterapkan

`AgentMembershipCard.tsx` sekarang menggunakan `coreApi.uploadPrivateUserDocument()` dengan purpose `membership_payment_proof`, menyimpan private document ID, dan mengirim payment intent ke `POST /management/membership/:travelId/payment-intents`. Jalur `supabase.storage` dan `supabase.functions.invoke('create-payment')` telah dihapus dari komponen tersebut.

`usePremiumSubscription.ts` sekarang menggunakan Core API untuk create premium payment proof, daftar subscription admin, approval/rejection membership, pembacaan platform settings, dan perubahan harga setting. Endpoint baru `POST /platform/me/premium/payment-proofs` memakai harga plan dari database, memvalidasi ownership private document, dan menyimpan intent manual dengan status `pending`. Migration `09_membership_payment_intents_and_proofs.sql` menambahkan referensi payment proof dan tabel `membership_payment_intents`.

Static residual scan menunjukkan tidak ada direct Supabase pada tiga target P0 berikut:

```text
src/components/agent/AgentMembershipCard.tsx
src/hooks/usePremiumSubscription.ts
src/hooks/useAgentMembership.ts
```

Typecheck Core dan frontend berhasil setelah perubahan P0.

### Audit documents

| File | Temuan | Prioritas | Rekomendasi |
|---|---|---:|---|
| `src/components/booking/PaymentProofUpload.tsx` | Sudah Core-centric, tetapi tombol submit menggunakan `!uploadedPath`; state tersebut baru tersedia setelah submit berhasil | P0 | Ganti guard menjadi `!proofPayload`; tambahkan regression test pilih file → submit |
| `src/components/agent/HajiManagement.tsx` | Masih membaca media melalui Supabase Storage | P1 | Pindahkan ke private/presigned document API dan validasi booking/registration ownership |
| `src/components/admin/ManasikManagement.tsx` | Upload gambar dan public URL masih melalui Supabase Storage | P1 | Gunakan Core public asset endpoint dengan role/platform authorization |
| `src/hooks/usePrayers.ts` | Upload media prayer masih direct Supabase Storage | P1 | Tambahkan content media endpoint Core atau public asset endpoint dengan audit |
| `src/hooks/useJournals.ts` | Signed URL dan upload journal media masih direct Supabase Storage | P1 | Gunakan user-owned media API; jangan mengembalikan path storage mentah |

### Audit departure

Mayoritas departure/manifest management sudah menggunakan Core melalui `useManifest`, `useJamaahManifest`, `useItinerary`, dan departure management hooks. Tidak ditemukan direct Supabase table mutation pada scan departure utama. Residual yang perlu ditindaklanjuti adalah:

| Area | Temuan | Prioritas |
|---|---|---:|
| Query key | Beberapa key memakai `departureId` atau `travelId` tanpa tenant/branch context eksplisit | P1 |
| Pagination | Daftar departure dan manifest masih memiliki beberapa limit tetap/flat list | P1 |
| Packing | `PackingListGenerator.tsx` masih memanggil Edge Function `generate-packing-list` | P1 |
| Notifications | `useWhatsAppReminder.ts` masih memanggil Edge Function dan belum sepenuhnya menjadi command Core | P1 |
| Realtime group | `useGroupTracking.ts` masih menggunakan channel Supabase | P1 |

### Audit equipment

Tidak ditemukan direct Supabase pada file yang teridentifikasi secara eksplisit sebagai equipment/perlengkapan/inventory. Ini bukan bukti bahwa domain sudah lengkap; audit menemukan bahwa modul equipment belum memiliki surface Core yang jelas pada frontend management. Gap fungsional yang perlu dikonfirmasi adalah:

1. CRUD equipment dan kategori belum memiliki kontrak Core yang terlihat jelas.
2. Allocation equipment ke departure atau jamaah belum terpetakan ke endpoint canonical.
3. Stock/availability equipment belum menggunakan ledger atau reservation policy seperti Commerce inventory.
4. Query key equipment perlu memakai tenant dan branch context ketika modul diaktifkan.

Status domain equipment: **belum dapat dinyatakan siap integrasi karena kontrak fitur dan endpoint belum teridentifikasi**.

### Audit content

| File | Temuan | Prioritas |
|---|---|---:|
| `src/components/admin/PagesManagement.tsx` | Upload media masih Supabase Storage; insert `page_versions` masih direct Supabase | P0 untuk admin content | Migrasikan CRUD page/version dan media ke Platform Admin Core dengan audit log |
| `src/components/admin/QuranManagement.tsx` | Read `quran_ayahs`, `quran_surahs`, `quran_sync_logs` dan sync Edge Function masih direct Supabase | P1 | Pisahkan public read API dan protected admin sync endpoint Core |
| `src/hooks/useQuranAdmin.ts` | Sync Quran memakai Edge Function | P1 | Core command dengan idempotency, audit, dan worker retry |
| `src/hooks/usePrayers.ts` | CRUD prayer sudah memiliki sebagian query/mutation, tetapi upload media masih direct Storage | P1 | Core content media endpoint |
| `src/components/admin/ManasikManagement.tsx` | Upload image dan public URL direct Storage | P1 | Platform asset API |
| `src/hooks/useFeedback.ts` | Admin feedback/content rating perlu dicek ulang terhadap Platform Admin authorization | P2 | Pastikan semua admin reads/mutations tenant/platform scoped |

### Residual premium yang masih berada di luar P0 target

`PremiumPaymentModal.tsx` dan `PremiumUpgradeModal.tsx` masih mempunyai direct Supabase Storage dan Edge Function `create-payment`. Keduanya belum memakai helper Core premium intent yang baru dibuat. Karena keduanya customer-facing premium payment, residual ini tetap berstatus **P0 payment domain**, meskipun `usePremiumSubscription.ts` sudah bersih.

### Prioritas lanjutan

| Urutan | Pekerjaan | Kriteria selesai |
|---:|---|---|
| 1 | Perbaiki `PaymentProofUpload` guard | Submit aktif setelah file siap dan test UI berhasil |
| 2 | Migrasikan `PremiumPaymentModal` dan `PremiumUpgradeModal` | Tidak ada storage/function payment legacy |
| 3 | Migrasikan `PagesManagement` | Page CRUD, versioning, media, audit, dan authorization melalui Core |
| 4 | Migrasikan Haji/Manasik/Prayer media | Tidak ada direct Storage pada content/document management |
| 5 | Ganti Packing/WhatsApp Edge Function | Command Core dengan idempotency dan worker ownership |
| 6 | Definisikan contract equipment | Endpoint CRUD, allocation, availability, tenant context, dan test isolation |
| 7 | Tenant-aware cache audit | Semua booking, departure, document, content, dan equipment key memasukkan context |
