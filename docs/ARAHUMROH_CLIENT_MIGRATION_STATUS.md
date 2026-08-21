# ArahUmroh Apps Client Migration Status

## Prinsip

`umroh-connect` adalah consumer app ArahUmroh Apps. Marketplace dan customer transaction flow harus menggunakan `coreApiClient`; aplikasi tidak boleh menulis langsung ke tabel transaksi core.

## Flow yang sudah menggunakan core API

| Flow | Client path | Status |
|---|---|---|
| Marketplace package list/search | `src/hooks/usePackages.ts` → `src/lib/coreApi.ts` | Core API |
| Package detail | `usePackageById` → marketplace listing/package endpoint | Core API |
| Travel profile | `coreApi.getTravelProfile` | Core API |
| Customer booking list | `useUserBookings` | Core API |
| Customer booking detail | `useBookingDetails` | Core API |
| Checkout session | `useCreateBooking` | Core API, idempotent |
| Payment order | `useCreatePaymentOrder` | Core API |
| Payment status | `coreApi.getPaymentOrder` | Core API |

## Flow yang masih legacy

| Flow | Current access | Classification | Next API required |
|---|---|---|---|
| Agent booking list | Direct Supabase `bookings` | `MIGRATE-CORE` | Tenant-scoped management booking read |
| Agent booking status | Direct Supabase mutation | `MIGRATE-CORE` | Management booking command with capability check |
| Agent record payment | Direct Supabase `payment_schedules` mutation | `MIGRATE-CORE` | Core payment allocation/reconciliation command |
| Payment proof upload | Direct Supabase storage/table | `MIGRATE-CORE` | Core private document upload/session API |
| Manifest | Direct Supabase departures/bookings | `MIGRATE-CORE` | Core operations manifest API |
| Admin analytics | Direct Supabase aggregate reads | `KEEP-LEGACY` temporarily | Core analytics/reporting API |
| Daily Muslim features | Local/public integrations | `KEEP-LEGACY` | Not transaction ownership |

## Guardrails

1. Jangan menambahkan mutation baru ke `bookings`, `departures`, `payments`, `payment_schedules`, atau `seat_reservations` dari frontend.
2. Jangan menghapus Supabase client sebelum endpoint core yang setara dan contract test tersedia.
3. Semua customer checkout harus membawa idempotency key.
4. Status payment hanya dianggap final berdasarkan webhook provider yang diproses core.
5. Snapshot listing tidak boleh digunakan untuk keputusan final seat.
6. Direct Supabase access yang masih ada harus diberi owner, ticket, dan target migration phase.

## Target berikutnya

Core perlu menyediakan management API untuk booking read, status transition, payment allocation, document upload authorization, dan manifest. Setelah itu hook agent/operations akan dipindahkan secara bertahap tanpa mengubah kontrak komponen UI secara besar.
