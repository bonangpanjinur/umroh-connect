# E2E Smoke Test Tenant Pilot

Panduan ini memverifikasi jalur nyata **umroh-connect → tenant pilot → sistem-travel-umroh** menggunakan data sintetis. Jalankan terlebih dahulu pada staging atau tenant pilot yang disetujui. Script tidak menghapus data dan secara default tidak menulis catalog baru.

> Jangan gunakan nama, nomor telepon, email, atau data jamaah nyata. Semua nilai default script memakai nama test dan domain `example.invalid`.

## 1. Prasyarat

Pastikan migration Fase 1–4 sudah diterapkan pada Supabase pusat dan database tenant pilot. Edge Function berikut harus aktif:

```text
lead-routing
catalog-ingest
lead-admin
```

Pastikan worker sistem travel dapat dijalankan pada tenant pilot:

```bash
pnpm --filter @workspace/api-server worker:lead-inbox
pnpm --filter @workspace/api-server worker:catalog-sync
```

Siapkan satu installation production/staging yang statusnya `connected` atau dapat menerima pull. Pastikan credential yang digunakan memiliki scope katalog/health dan akses lead sesuai konfigurasi deployment.

## 2. Konfigurasi environment

Jalankan dari repository `umroh-connect`. Jangan commit file `.env` dan jangan menampilkan secret dalam log shell.

```bash
export LEAD_ROUTING_URL="https://<supabase-project>.supabase.co/functions/v1/lead-routing"
export CATALOG_INGEST_URL="https://<supabase-project>.supabase.co/functions/v1/catalog-ingest"
export INTEGRATION_KEY="<key-id-tenant-pilot>"
export INTEGRATION_SECRET="<secret-tenant-pilot>"
export INSTALLATION_ID="<installation-id-tenant-pilot>"
export SMOKE_TEST_PRODUCT_ID="<optional-central-product-id>"
export SMOKE_TEST_DOMAIN="<optional-pilot-domain>"
export SMOKE_TEST_NAME="Pilot Smoke Test"
export SMOKE_TEST_PHONE="+6281111111111"
```

`SMOKE_TEST_PRODUCT_ID` atau `SMOKE_TEST_DOMAIN` wajib tersedia agar pusat dapat meresolusikan tenant. Jika keduanya diisi, product ID menjadi konteks routing utama.

## 3. Pemeriksaan awal

Periksa status tenant dan installation dari dashboard admin:

```text
Admin → Pengguna & Agen → Tenant & Integrasi
Admin → Pengguna & Agen → Lead & Delivery
```

Pastikan domain, tenant, installation, dan credential memang milik tenant pilot. Catat `INSTALLATION_ID` dan jangan memakai credential tenant lain.

Jalankan smoke test kontrak lokal:

```bash
pnpm test:integration:contract
```

## 4. Jalankan smoke test lead

Perintah default melakukan tiga pemeriksaan: submit lead sintetis, submit ulang dengan `Idempotency-Key` yang sama, lalu pull dan acknowledgement dari installation pilot.

```bash
node scripts/smoke-test-pilot.mjs
```

Output yang diharapkan:

```text
PASS lead submit + idempotency: <lead-id>
PASS lead pull + acknowledgement: <delivery-id>
SKIP catalog write: CATALOG_INGEST_URL is not set.
SMOKE TEST PASSED
```

Jika `CATALOG_INGEST_URL` diisi tetapi flag catalog tidak diberikan, catalog tetap dilewati agar test default tidak memutasi read model katalog.

## 5. Uji catalog secara eksplisit

Catalog test hanya dilakukan setelah operator menyetujui pembuatan atau pembaruan resource sintetis. Siapkan ID resource yang memang disediakan untuk smoke test, bukan ID paket jamaah aktif.

```bash
export SMOKE_TEST_ENTITY_ID="00000000-0000-0000-0000-000000000001"
export SMOKE_TEST_ENTITY_VERSION="1"
export SMOKE_TEST_CATALOG_DATA='{"id":"00000000-0000-0000-0000-000000000001","name":"Pilot Smoke Package","package_type":"umroh","is_active":false,"duration_days":1,"includes":[],"excludes":[],"gallery_urls":[]}'
node scripts/smoke-test-pilot.mjs --allow-catalog-write
```

Output yang diharapkan:

```text
PASS catalog ingestion: processed
SMOKE TEST PASSED
```

Karena read model katalog menyimpan hasil ingestion, resource sintetis harus dibuat `is_active: false` atau dihapus/diarsipkan melalui prosedur admin setelah test. Jangan menghapus resource produksi secara langsung dari database.

## 6. Verifikasi di dashboard dan sistem travel

Buka **Lead & Delivery** dan cari lead dengan email test. Pastikan status delivery berubah dari `pending`/`claimed` menjadi `accepted`, attempt count tercatat, dan tidak ada error.

Pada sistem travel, pastikan lead muncul tepat satu kali pada tabel `leads`, memiliki `central_lead_id`, `central_delivery_id`, `central_received_at`, dan `central_status = accepted`. Gunakan query read-only berikut jika akses database pilot tersedia:

```sql
SELECT id, full_name, email, central_lead_id, central_delivery_id, central_status, central_received_at
FROM leads
WHERE email LIKE 'pilot-smoke-%@example.invalid'
ORDER BY created_at DESC;
```

Expected result adalah satu row untuk setiap eksekusi smoke test.

## 7. Verifikasi idempotensi dan retry

Jalankan kembali command yang sama tidak akan memakai `Idempotency-Key` yang sama karena script membuat key baru setiap eksekusi. Untuk menguji idempotensi secara manual, kirim request submit dua kali menggunakan satu header `Idempotency-Key`; request kedua harus menghasilkan `status = duplicate` dan `lead_id` yang sama.

Untuk retry, gunakan dashboard pada delivery `rejected` atau `dead_letter`, klik **Retry**, lalu jalankan worker lead inbox kembali. Retry harus menghasilkan audit action `delivery.manual_retry` dan delivery kembali ke `pending`.

## 8. Troubleshooting

| Gejala | Pemeriksaan |
|---|---|
| `TENANT_ROUTE_NOT_FOUND` | Pastikan `SMOKE_TEST_PRODUCT_ID` aktif di katalog pusat atau `SMOKE_TEST_DOMAIN` sudah terverifikasi dan berstatus active. |
| `TENANT_NOT_CONNECTED` | Pastikan installation tenant pilot berstatus connected dan environment sesuai. |
| `INVALID_SIGNATURE` | Pastikan key, secret, installation ID, URL, jam server, dan canonical path benar. Jangan menambahkan slash berbeda pada URL function. |
| `NONCE_REPLAYED` | Jangan menggunakan nonce yang sama; script membuat nonce baru setiap request. |
| Lead tidak muncul saat pull | Pastikan worker memakai credential installation yang sama dan delivery masih pending/available. |
| Lead masuk lebih dari sekali | Hentikan worker ganda, periksa unique index `central_lead_id`, dan jangan menghapus index deduplikasi. |
| Catalog berstatus stale | Naikkan `SMOKE_TEST_ENTITY_VERSION` hanya untuk resource test yang memang diizinkan. Jangan memaksa versi pada resource produksi. |
| Dashboard kosong | Pastikan migration lead sudah diterapkan dan user login memiliki role admin atau super_admin. |

## 9. Kriteria lulus

Smoke test tenant pilot dinyatakan lulus apabila lead sintetis berhasil di-submit, submit kedua bersifat idempotent, lead berhasil dipull oleh worker, lead tersimpan tepat satu kali pada sistem travel, acknowledgement accepted kembali ke pusat, dashboard memperlihatkan delivery accepted tanpa error, dan catalog test—jika diaktifkan—menghasilkan processed atau stale sesuai versi yang diharapkan.
