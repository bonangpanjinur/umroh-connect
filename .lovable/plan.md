

# Laporan Audit Lengkap — Fitur, Database & Bug

---

## I. STATUS DATABASE

**89 tabel** | Semua RLS enabled | Linter: 0 issues

### Temuan Keamanan (9 findings dari security scanner)

| # | Level | Masalah | Tabel/Bucket |
|---|-------|---------|-------------|
| 1 | ERROR | Profiles sensitif (email, paspor) terbaca semua authenticated user | `profiles` |
| 2 | ERROR | Travel data internal (approval_notes) terbuka publik | `travels` |
| 3 | ERROR | Realtime channels tanpa authorization | `realtime.messages` |
| 4 | WARN | Platform settings (harga internal) terbuka publik | `platform_settings` |
| 5 | WARN | Travel logos bisa di-overwrite user lain | `travel-logos` bucket |
| 6 | WARN | Package images bisa di-delete user lain | `package-images` bucket |
| 7 | WARN | Journal photos tidak enforce public/private setting | `journal-photos` bucket |
| 8 | WARN | Quran sync logs terbuka publik | `quran_sync_logs` |
| 9 | WARN | departure_notification_logs tidak punya INSERT policy | `departure_notification_logs` |

### Duplicate Policies
- `platform_settings` punya 2 SELECT policy identik: "Anyone can view platform settings" + "Anyone can view settings"
- `platform_settings` punya 2 ALL admin policy identik

---

## II. BUG KODE

### Bug 1 — `as any` Masif (54 file, 693 match)
Banyak query Supabase memakai `as any` karena types belum ter-regenerate. Tabel yang tidak dikenali types: `dzikir_types`, `user_dzikir_logs`, `quran_khatam_targets`, `website_templates`, dll. Ini menyembunyikan error saat compile.

### Bug 2 — Duplicate ShopView Rendering
`Index.tsx` baris 171-172 render `<ShopView>` via `activeView === 'shop'`, dan baris 257-258 render lagi via `activeTab === 'shop'`. Dua jalur masuk, dua perilaku back button berbeda.

### Bug 3 — IbadahHubView Tidak Preserve Tab
Baris 187: `setSearchParams({ view: 'quran' })` menghapus `tab` param saat navigate ke Quran dari Ibadah view.

### Bug 4 — `profiles` Policy Terlalu Longgar
Policy "Authenticated can view basic profiles" `USING (true)` mengekspos semua kolom (email, phone, passport_number, emergency contacts) ke semua authenticated user. Seharusnya hanya nama dan avatar.

---

## III. KEKURANGAN FITUR / DX

1. **Types tidak sinkron** — Banyak tabel baru tidak ada di generated types, memaksa `as any`
2. **Tidak ada database view** untuk `travels` publik — field internal ikut terekspos
3. **Storage bucket `journal-photos` masih public** — meskipun RLS ada, URL publik bypass RLS
4. **Tidak ada rate limiting** pada edge functions yang `verify_jwt = false`

---

## IV. RENCANA PERBAIKAN PER PHASE

### Phase 1 — Keamanan Kritis (Migration + Storage)
**Effort: Kecil | Impact: Tinggi**

1. **Fix profiles SELECT policy** — Hapus "Authenticated can view basic profiles" `USING(true)`. Buat view `public_profiles` (user_id, full_name, avatar_url) dan policy yang hanya membaca view. Atau buat policy baru yang scope ke kolom non-sensitif via database view.

2. **Fix travels exposure** — Buat `public_travels` view yang exclude `approval_notes`, `verified_by`, `suspension_reason`. Update kode frontend untuk query view ini di halaman publik.

3. **Fix storage ownership**:
   - `travel-logos`: UPDATE/DELETE policy tambah path ownership `(auth.uid())::text = (storage.foldername(name))[1]`
   - `package-images`: UPDATE/DELETE policy tambah path ownership
   - `journal-photos`: Ubah bucket jadi private

4. **Cleanup duplicate policies** pada `platform_settings`

5. **Restrict `quran_sync_logs`** SELECT ke admin only

6. **Tambah INSERT policy** pada `departure_notification_logs` untuk service role

```sql
-- Phase 1 Migration SQL
-- 1. Profiles: replace broad policy with view-based access
DROP POLICY IF EXISTS "Authenticated can view basic profiles" ON public.profiles;
CREATE VIEW public.public_profiles AS 
  SELECT user_id, full_name, avatar_url FROM public.profiles;
-- Grant access to the view for authenticated lookups

-- 2. Storage fixes
DROP POLICY IF EXISTS "Owners can update travel logos" ON storage.objects;
CREATE POLICY "Owners can update travel logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'travel-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners can delete travel logos" ON storage.objects;
CREATE POLICY "Owners can delete travel logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'travel-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own package images" ON storage.objects;
CREATE POLICY "Users can delete own package images" ON storage.objects
  FOR DELETE USING (bucket_id = 'package-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own package images" ON storage.objects;
CREATE POLICY "Users can update own package images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'package-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3. Restrict platform_settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.platform_settings;
-- Keep one public SELECT for pricing display (needed by frontend)

-- 4. Restrict quran_sync_logs
DROP POLICY IF EXISTS "Anyone can read sync logs" ON public.quran_sync_logs;
CREATE POLICY "Admins can read sync logs" ON public.quran_sync_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 5. departure_notification_logs INSERT
CREATE POLICY "Service can insert notification logs" ON public.departure_notification_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Phase 2 — Bug Fix Kode
**Effort: Sedang | Impact: Sedang**

1. **Fix duplicate ShopView** — Hapus jalur `activeView === 'shop'` di `renderView()`. Shop sudah punya tab sendiri di BottomNav. Jika ada deep link `/?view=shop&shopTab=orders`, redirect ke `/?tab=shop&shopTab=orders`.

2. **Fix IbadahHubView tab preservation** — Ganti `setSearchParams({ view: 'quran' })` menjadi memakai `openView('quran')` yang sudah preserve tab param.

3. **Update kode yang query profiles orang lain** — File yang perlu update:
   - `useReviews.ts` — query `full_name, avatar_url` → gunakan `public_profiles` view
   - `usePublicReviews.ts` — sama
   - `useShopChat.ts` — sama  
   - `usePremiumSubscription.ts` — query `full_name, email` → admin-only, tetap pakai `profiles`
   - `useAdminData.ts` — admin context, tetap pakai `profiles`

### Phase 3 — Type Safety & DX
**Effort: Sedang | Impact: Sedang**

1. **Regenerate Supabase types** — Types akan otomatis ter-update setelah migration dijalankan. Ini akan menghilangkan sebagian besar `as any`.

2. **Untuk tabel yang masih perlu `as any`** — Buat typed helper functions:
   ```typescript
   // src/lib/supabase-helpers.ts
   export const typedFrom = (table: string) => supabase.from(table as any);
   ```

3. **Update `00000000000000_initial_schema.sql`** — Sinkronkan dengan semua fix di Phase 1.

### Phase 4 — Hardening Lanjutan
**Effort: Kecil | Impact: Rendah**

1. **Jadikan `journal-photos` bucket private** — Update semua kode yang pakai `getPublicUrl` untuk journal photos menjadi `createSignedUrl`.

2. **Tambah Realtime authorization** — Pastikan semua tabel yang di-publish ke realtime sudah punya SELECT policy ketat (sudah sebagian besar done). Dokumentasikan channel naming convention.

3. **Review edge functions** yang `verify_jwt = false` — Pastikan masing-masing punya validasi internal.

---

## V. RINGKASAN PRIORITAS

| Phase | Fokus | Item | Estimasi |
|-------|-------|------|----------|
| 1 | Keamanan DB & Storage | 6 fix | 1 migration + config |
| 2 | Bug fix kode | 3 fix | 4 file edit |
| 3 | Type safety | Types + helpers | 2 file edit |
| 4 | Hardening lanjutan | 3 fix | 3 file edit + bucket config |

