# Core API Migration

`umroh-connect` menggunakan adapter `src/lib/coreApi.ts` untuk membaca marketplace dari `sistem-travel-umroh`.

## Environment

Gunakan environment variable berikut:

```env
# Production same-origin melalui reverse proxy
VITE_CORE_API_URL=/api/v1

# Local development bila core berjalan di port 3001
# VITE_CORE_API_URL=http://localhost:3001/api/v1
```

Jika variable tidak diisi, client menggunakan `/api/v1`. Deployment perlu memastikan path tersebut diproxy ke API core.

## Hook yang sudah dimigrasikan

`src/hooks/usePackages.ts` sekarang menggunakan:

- `GET /marketplace/listings` melalui `coreApi.listMarketplaceListings()`.
- `GET /marketplace/listings/:departureId` melalui `coreApi.getMarketplaceListing()`.

Adapter mengubah DTO marketplace ke bentuk `PackageWithDetails` lama sehingga komponen UI paket tidak perlu diubah pada tahap read migration pertama.

## Aturan client

Client selalu mengirim `X-Request-Id`, memiliki timeout 10 detik, dan mengubah error envelope core menjadi `CoreApiError`. Client tidak menyimpan service-role key dan tidak boleh menulis langsung ke tabel `packages`, `departures`, `bookings`, atau `payments`.

## Pengembangan berikutnya

Tahap selanjutnya adalah menambahkan DTO travel/tenant canonical, contract test terhadap OpenAPI, lalu memigrasikan detail package, search/filter lanjutan, inquiry, dan akhirnya checkout/booking. Direct Supabase access pada hook transaksi harus dihapus setelah endpoint command core tersedia.
