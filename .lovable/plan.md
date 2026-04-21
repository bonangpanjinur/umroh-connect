

# Rencana Perbaikan — Issue yang Tersisa

## Status Saat Ini
- ✅ Phase 1-4 selesai (DB security, journal-photos private, edge function auth, midtrans webhook)
- ❌ Masih ada **5 finding security** (3 ERROR, 2 WARN) + **4 linter warnings**
- ❌ Migration belum bisa dikonsolidasi (folder read-only)

## Issue Tersisa

### A. ERROR — Wajib Diperbaiki

**A1. Bucket `uploads` masih public** (sensitif: bukti transfer, struk)
- Ubah ke private + RLS policy berbasis ownership folder `{user_id}/...`
- Update kode upload untuk pakai struktur folder user_id
- Ganti `getPublicUrl` → `createSignedUrl` di komponen yang baca file dari `uploads`

**A2. `travel-logos` & `package-images` — UPDATE/DELETE tanpa ownership check**
- Saat ini siapapun authenticated bisa hapus/ubah logo travel lain
- Tambah RLS: `auth.uid()::text = (storage.foldername(name))[1]`
- Update kode upload pakai prefix folder `{user_id}/`

**A3. `haji-documents` — semua agent bisa lihat dokumen jamaah travel lain**
- NIK, paspor, KK terekspos lintas travel
- Ganti `has_role(auth.uid(), 'agent')` dengan check `owns_travel()` via tabel `haji_registrations`

**A4. Edge function input validation** (`generate-packing-list`, `recommend-packages`)
- Tambah validasi: tanggal valid, duration 1-90, gender enum, budget bounds, array length

### B. WARN — Hardening

**B1. Route guards client-side only** (AdminDashboard, AgentDashboard)
- Buat `<ProtectedRoute requiredRole="admin">` wrapper
- Apply ke semua route admin/agent di App.tsx

**B2. Linter: 4 public bucket allows listing**
- Otomatis terselesaikan setelah A1 (uploads → private). Sisa public bucket (`travel-logos`, `package-images`, `prayer-audio`, `shop-images`) — tambah policy yang membatasi LIST tanpa kehilangan akses GET.

## Tahapan Eksekusi

### Phase 5 — Storage Lockdown (1 migration + edit kode)
1. Migration: `uploads` → private, fix RLS `travel-logos`/`package-images`/`haji-documents`
2. Update upload helpers pakai folder `{user_id}/...`
3. Update reader pakai `createSignedUrl` untuk `uploads` & `haji-documents`

### Phase 6 — Edge Function Validation (2 file)
4. Tambah validator input di `generate-packing-list` & `recommend-packages`

### Phase 7 — Route Guards (1 file baru + edit App.tsx)
5. Buat `ProtectedRoute.tsx` + apply ke route admin/agent/seller

### Phase 8 — Bucket Listing Policy (1 migration)
6. Restrict LIST policy di public buckets (tetap allow SELECT object by name)

## Estimasi
| Phase | Effort | Dampak |
|-------|--------|--------|
| 5 | 1 migration + 4-6 file | 🔴 Kritis (PII jamaah aman) |
| 6 | 2 file | 🟡 Medium (DoS prevention) |
| 7 | 2 file | 🟡 Medium (info leak) |
| 8 | 1 migration | 🟢 Low (cleanup linter) |

## Catatan
- Konsolidasi migration tetap **tidak bisa** dilakukan otomatis (folder read-only) — perlu manual oleh maintainer
- Setelah Phase 5-8 selesai, security scanner harusnya tinggal 0 ERROR, max 1-2 WARN info-level

