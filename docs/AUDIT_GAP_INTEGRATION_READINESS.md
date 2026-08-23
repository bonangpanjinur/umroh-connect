# Audit Gap Integrasi ArahUmroh — Readiness Lanjutan

**Tanggal:** 23 Agustus 2026  
**Frontend:** `umroh-connect`  
**Core:** `sistem-travel-umroh`  
**Scope:** residual direct Supabase, security route, tenant/branch isolation, Core API coverage, storage, realtime, worker, testing, dan deployment.

## Executive summary

Setelah migrasi commerce, booking, membership, dan premium payment, residual direct Supabase frontend masih ditemukan pada **19 file** dengan sekitar **35 akses legacy**. Tidak seluruh residual berbahaya secara sama: sebagian adalah public content read, sebagian realtime yang belum dipusatkan, tetapi terdapat beberapa mutation transaksi/management yang masih berstatus **P0**.

Temuan P0 terbaru adalah `useShopCart.ts` yang masih melakukan delete langsung ke `shop_cart_items`, `PagesManagement.tsx` yang masih menulis `page_versions` secara langsung, serta content/Quran management yang masih menggunakan Supabase Storage atau Edge Function. Payment premium target sebelumnya sudah bersih dari direct Supabase.

> Status keseluruhan: **belum siap pilot production penuh** sampai mutation cart, content management, dan seluruh route management berisiko tinggi diverifikasi melalui Core API.

## 1. Residual frontend terklasifikasi

| Prioritas | File/domain | Akses | Risiko | Keputusan |
|---|---|---|---|---|
| P0 | `src/hooks/useShopCart.ts` | `delete` langsung ke `shop_cart_items` | Bypass cart ownership, tenant/user isolation, dan idempotency | Migrasikan ke Commerce cart command Core |
| P0 | `src/components/admin/PagesManagement.tsx` | Upload Storage dan insert `page_versions` langsung | Admin content dapat melewati authorization, audit, dan version transaction | Tambahkan Platform Content API |
| P1 | `src/components/admin/QuranManagement.tsx`, `src/hooks/useQuranAdmin.ts` | Read tabel Quran dan `sync-quran-data` Edge Function | Admin sync tidak berada pada Core command/worker/audit | Pindahkan ke Core admin Quran API |
| P1 | `src/components/admin/ManasikManagement.tsx`, `src/hooks/usePrayers.ts`, `src/hooks/useJournals.ts` | Supabase Storage upload/signed URL | Raw storage path/public URL tidak mengikuti object-storage policy terpusat | Pindahkan ke Core asset/content API |
| P1 | `src/components/agent/HajiManagement.tsx` | Supabase Storage media | Dokumen/media management tidak menggunakan signed private API | Pindahkan ke private document/presigned API |
| P1 | `src/components/packing/PackingListGenerator.tsx` | Edge Function `generate-packing-list` | Command belum memiliki Core authorization, idempotency, dan retry | Buat Core packing command/worker |
| P1 | `src/hooks/useWhatsAppReminder.ts` | Edge Function `send-whatsapp-reminder` | Reminder dapat tidak tercatat sebagai collection/audit event | Gunakan Core reminder command dan worker |
| P1 | `src/hooks/useAgentNotifications.ts` | Supabase channel dan Edge Function notification check | Notification belum sepenuhnya berasal dari Core event stream | Migrasikan ke notification API/worker |
| P1 | `src/hooks/useChat.ts`, `useChatNotifications.ts` | Supabase realtime channels | Ownership channel harus dibuktikan pada server; risiko event lintas tenant | Gunakan Core chat API plus polling/SSE terproteksi |
| P1 | `src/hooks/useOrderNotifications.ts` | Supabase realtime order channel | Event order belum jelas tenant/user-owned | Migrasikan ke Core event projection |
| P1 | `src/hooks/useGroupTracking.ts`, `useGeofencing.ts` | Supabase realtime group/geofence channels | Tracking event berpotensi bocor jika channel naming menjadi satu-satunya guard | Validasi membership di server dan audit channel policy |
| P2 | `src/components/akun/AkunView.tsx` | Upload avatar dan update `profiles` langsung | Profile mutation tidak memakai Core audit | Pindahkan ke profile API |
| P2 | `src/components/recommendation/AIRecommendationWizard.tsx` | Edge Function recommendation | Bukan transaction domain, tetapi perlu rate limit dan abuse control | Pindahkan saat AI API hardening |

### Target yang sudah bersih

Static scan tidak menemukan direct Supabase pada `AgentMembershipCard`, `useAgentMembership`, `usePremiumSubscription`, `PremiumPaymentModal`, `PremiumUpgradeModal`, `PaymentProofUpload`, `useSellerOrders`, `useShopProducts`, `useShopChat`, `ShopChatView`, `OrderHistoryView`, `useWishlist`, `WishlistView`, dan `useRealtimeOrders`.

## 2. Domain booking dan payment setelah refactor premium

Booking utama sudah menggunakan Core API untuk list/detail, checkout, status, payment schedules, allocation, payment notifications, payment order, dan payment proof. Premium modal juga sudah memakai Core payment intent serta private document ID.

Residual correctness yang masih perlu ditutup:

| Prioritas | Temuan | Dampak |
|---|---|---|
| P0 | `PaymentProofUpload` sudah diperbaiki menggunakan `proofPayload` sebagai submit guard | Tidak ada blocker dari temuan ini |
| P1 | Query key booking/payment belum semuanya memuat tenant/branch context | Cache lama berisiko tampil ketika context berpindah |
| P1 | `BookingDetailModal` perlu dipastikan mengirim `agentNotes`, proof document, dan notes ke command canonical | Histori operasional/payment dapat tidak lengkap |
| P1 | Modal premium masih menunggu webhook untuk activation, tetapi UI perlu refetch status setelah redirect/payment return | User dapat melihat status lama sampai query invalidated |
| P2 | Beberapa statistik payment/upcoming masih dihitung dari data browser | Tidak scalable pada volume booking besar |

## 3. Audit route Core

Static route inventory menemukan sekitar **374 deklarasi route pada 58 file v1**. Hasil berikut adalah heuristic dari middleware pada file route; route yang memakai middleware global atau wrapper di file mounting harus diverifikasi dengan integration test, bukan dianggap aman hanya berdasarkan angka.

| Route file | Route count | Indikasi yang perlu diverifikasi |
|---|---:|---|
| `whatsapp.ts` | 56 | Hanya sebagian route menunjukkan auth/rate limiter; tenant indicator tidak terlihat pada file. Webhook/public callback harus fail-closed dan command harus protected. |
| `commerce.ts` | 30 | Sebagian besar route memiliki auth, tetapi route-local rate limiter tidak terlihat. Pastikan global limiter benar-benar aktif pada mounting. |
| `platform-admin.ts` | 30 | Sebagian route tidak menunjukkan auth secara lokal; pastikan seluruh router dipasang di bawah `requireAuth` dan role/platform capability. |
| `marketplace.ts` | 23 | Tidak ada auth lokal yang dapat benar untuk public read, tetapi field projection dan public data leakage harus diuji. |
| `management-catalog.ts` | 12 | Auth/role lokal tidak terlihat; perlu verifikasi mounting dan tenant context. |
| `manifest.ts` | 9 | Tenant references ada, tetapi auth lokal tidak terlihat pada static scan. Uji booking/departure ownership lintas tenant. |
| `payment-management.ts` | 4 | Tenant references ada, tetapi auth lokal tidak terlihat. Berstatus high-risk karena payment mutation/read. |
| `management-bookings.ts` | 4 | Implementasi route sudah menggunakan `requireTenantContext` dan capability; static count auth biasa dapat menghasilkan false negative. |
| `payment-schedules.ts` | 3 | Ownership references ada; perlu test akses schedule booking tenant lain. |
| `booking-documents.ts` | 3 | Ownership references ada; perlu test signed URL dan document type authorization. |
| `management-reviews.ts` dan `management-analytics.ts` | 2 + 2 | Tenant references ada; pastikan query tidak menerima tenant ID dari client sebagai source of truth. |

### High-risk route test matrix yang masih diperlukan

| Area | Test minimum |
|---|---|
| Management booking | Tenant A tidak dapat list/detail/create/update booking tenant B; branch di luar membership ditolak |
| Payment management | Allocation, proof, schedule, refund, dan status transition tenant B ditolak |
| Documents | Signed URL hanya valid untuk owner/booking yang tepat; expired signature ditolak |
| WhatsApp | Secret provider kosong, signature invalid, duplicate event, retry, dan rate limit diuji |
| Commerce | Duplicate checkout/status/cart command, concurrent reserve/release, seller ownership, dan voucher redemption diuji |
| Marketplace public | Tidak ada email, phone, internal notes, raw storage path, atau private document URL dalam projection |
| Platform admin | User bukan platform admin menerima 401/403 pada semua route, termasuk route yang memakai global wrapper |

## 4. Storage dan private-data policy

Masih ada tiga pola yang harus dihapus dari frontend:

1. `supabase.storage.from(...).upload()` untuk dokumen atau content media.
2. `getPublicUrl()` untuk asset yang seharusnya private atau membutuhkan approval.
3. Penyimpanan raw storage path sebagai payment proof atau dokumen tanpa Core document ID.

Pola target adalah upload ke Core dengan presigned URL atau base64 endpoint terbatas, menyimpan object key privat, lalu mengembalikan signed URL berumur pendek hanya setelah ownership query berhasil.

## 5. Test, migration, dan observability gap

| Area | Status | Gap |
|---|---|---|
| Typecheck/build | Berhasil pada batch terakhir | Tidak membuktikan transaction/ownership runtime |
| Local integration Docker | Harness tersedia | Docker Engine belum tersedia di sandbox sehingga PostgreSQL/Redis/LocalStack test belum dijalankan |
| Staging migrations | Runner tersedia dengan `ON_ERROR_STOP=1` | Belum dapat dieksekusi tanpa credential staging yang teridentifikasi |
| Payment webhook | Signature, inbox, retry, dead-letter tersedia | Provider fixtures dan raw-body/runtime configuration perlu diuji di staging |
| Reconciliation/expiry | Worker dan structured alert tersedia | Belum ada alert delivery/threshold dashboard yang dibuktikan end-to-end |
| Frontend E2E | Beberapa flow memiliki suite | Perlu scenario tenant switch, private document, premium payment return, dan cart duplicate command |
| Query cache | Sebagian sudah tenant-aware | Audit global dan cache clear saat context switch belum selesai |

## 6. Prioritas implementasi berikutnya

| Urutan | Prioritas | Pekerjaan | Kriteria selesai |
|---:|---|---|---|
| 1 | P0 | Migrasikan `useShopCart` delete/mutation ke Commerce cart API | Tidak ada direct cart mutation; idempotency dan user ownership diuji |
| 2 | P0 | Buat Platform Content API dan migrasikan `PagesManagement` | CRUD/version/media melalui Core, audit log dan role enforcement aktif |
| 3 | P0 | Audit runtime `payment-management`, `whatsapp`, `platform-admin`, dan `manifest` | Semua route high-risk memiliki auth/context/rate limit yang terbukti integration test |
| 4 | P1 | Migrasikan Quran/Prayer/Manasik/Journal media dan admin sync | Tidak ada direct Storage/Edge Function pada content management |
| 5 | P1 | Tenant-aware query key audit global | Context switch membersihkan cache lama dan semua key menyertakan scope |
| 6 | P1 | Migrasikan packing/reminder/notification command | Core command, audit, retry worker, dan dead-letter tersedia |
| 7 | P1 | Definisikan equipment API | CRUD, availability, allocation, branch scope, dan concurrency policy tersedia |
| 8 | P2 | Jalankan Docker integration suite pada machine yang memiliki Docker Engine | PostgreSQL/Redis/LocalStack smoke dan concurrency suite berhasil |

## Conclusion

Payment premium dan membership telah mencapai perbaikan signifikan: modal tidak lagi menggunakan Supabase Storage atau Edge Function payment, dan status pembayaran mengikuti Core webhook. Namun, integrasi keseluruhan masih memiliki gap P0 pada cart mutation dan content versioning, serta gap P1 pada media, realtime, notification, dan command worker. Route inventory juga perlu diverifikasi dengan mounting middleware dan integration test karena static presence/absence middleware pada file route tidak selalu mencerminkan runtime.

Sebelum pilot production, fokus terbaik adalah **menutup P0 cart/content/security runtime**, kemudian menjalankan Docker integration suite pada environment dengan Docker Engine dan credential test yang terisolasi.
