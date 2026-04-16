

# Rencana Selanjutnya — Phase 4 + Konsolidasi

---

## A. Phase 4: Hardening Lanjutan

### 1. Journal Photos → Private Bucket
- Ubah bucket `journal-photos` dari public ke private via migration
- Update semua kode yang pakai `getPublicUrl` menjadi `createSignedUrl` (perlu cari file yang reference journal-photos)

### 2. Edge Function Review
- 11 edge functions punya `verify_jwt = false` — review masing-masing apakah sudah punya validasi internal (auth header check, webhook signature, dll)
- Tambah validasi jika belum ada

---

## B. Konsolidasi Migration

### 3. Sinkronkan Initial Schema
- Update `supabase/migrations/00000000000000_initial_schema.sql` agar mencakup semua fix dari 3 migration baru:
  - `20260410145902` (privilege escalation, GPS leak, storage scoping)
  - `20260412005912` (public views, storage ownership, policy cleanup)
  - `20260412005923` (security invoker views)
- Setelah disinkronkan, hapus 3 migration tambahan tersebut agar tetap satu file bersih

---

## C. Estimasi

| Item | Effort |
|------|--------|
| Journal photos → private + signed URL | 1 migration + 2-3 file edit |
| Edge function validation review | 5-11 file review/edit |
| Sinkronisasi initial schema | 1 file edit + 3 file delete |

---

## Urutan Eksekusi
1. Sinkronisasi initial schema (bersihkan migration)
2. Journal photos → private bucket
3. Edge function security review

