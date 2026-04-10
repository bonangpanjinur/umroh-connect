

# Analisis Keamanan Database — Rencana Perbaikan

## Hasil Scan

**8 temuan keamanan**: 3 ERROR (kritis), 5 WARN

---

## KRITIS (ERROR) — Harus Diperbaiki Segera

### 1. Privilege Escalation: User Bisa Self-Assign Role "Agent"
**Policy:** `"Users can request agent role"` pada `user_roles`
**Masalah:** Siapapun yang login bisa INSERT `role = 'agent'` ke `user_roles` untuk dirinya sendiri. Karena `has_role()` query tabel ini, user langsung dapat akses agent — bisa buat travel agency, kelola geofence, dll.
**Fix:** Hapus policy ini. Assignment role hanya boleh dilakukan admin.

### 2. Data Sensitif Profiles Terbuka untuk Publik
**Policy:** `"Profiles are viewable by everyone"` → `USING (true)`
**Masalah:** Email, nomor telepon, nomor paspor, kontak darurat semua user bisa dibaca oleh siapapun termasuk user anonim.
**Fix:** Ganti policy SELECT menjadi:
- User bisa lihat profil sendiri (`auth.uid() = user_id`)
- User authenticated bisa lihat data terbatas (nama, avatar) untuk keperluan cross-lookup
- Admin bisa lihat semua

### 3. Bug RLS: GPS Semua User Bocor via group_locations
**Policy:** `"Group members can view all locations in their group"`
**Masalah:** Kondisi `gl.group_id = gl.group_id` adalah self-reference (selalu true). Akibatnya siapapun yang pernah share lokasi bisa lihat GPS, battery level semua user di semua group.
**Fix:** Ganti menjadi `gl.group_id = group_locations.group_id`

---

## PERINGATAN (WARN) — Perlu Diperbaiki

### 4. Leaked Password Protection Disabled
**Fix:** Aktifkan via `configure_auth` tool dengan `password_hibp_enabled: true`

### 5. Journal Photos Publik Meski Journal Private
**Policy:** `"Anyone can view journal photos"` → `USING (bucket_id = 'journal-photos')`
**Masalah:** Foto jurnal private bisa diakses siapapun yang tahu URL path-nya.
**Fix:** Restrict SELECT ke owner: `(auth.uid())::text = (storage.foldername(name))[1]`

### 6. Travel Agency Data Kontak Terbuka Publik
**Policy:** `"Anyone can view travels"` → `USING (true)`
**Masalah:** Email, phone, WhatsApp, approval_notes, verified_by terbuka untuk publik.
**Fix:** Ini bisa diterima untuk marketplace (phone/WhatsApp sengaja publik), tapi sembunyikan field internal seperti `approval_notes`, `verified_by`, `suspension_reason`. Bisa pakai database view atau filter di aplikasi.

### 7. Realtime Channel Tanpa Authorization
**Masalah:** Tidak ada RLS pada `realtime.messages`, sehingga user authenticated bisa subscribe ke channel apapun termasuk chat privat orang lain.
**Fix:** Tambah RLS policy pada `realtime.messages` — namun ini tabel reserved Supabase, jadi kita **tidak boleh** modifikasi langsung. Alternatifnya: pastikan setiap tabel yang di-publish ke realtime sudah punya RLS SELECT policy yang ketat (sudah dilakukan).

### 8. Storage Bucket "uploads" Tanpa Path Scoping
**Policy:** `"Authenticated users can upload"` → `WITH CHECK (bucket_id = 'uploads')`
**Masalah:** User bisa upload ke path apapun, termasuk menimpa file user lain.
**Fix:** Tambah path ownership: `(auth.uid())::text = (storage.foldername(name))[1]`

---

## Rencana Implementasi

Satu migration SQL yang memperbaiki semua 7 issue (issue #7 Realtime tidak bisa di-fix via migration):

### Migration SQL:

```sql
-- FIX 1: Hapus privilege escalation - user tidak boleh self-assign role
DROP POLICY IF EXISTS "Users can request agent role" ON public.user_roles;

-- FIX 2: Profiles - restrict SELECT ke data yang relevan
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can view basic profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
-- (Masih perlu authenticated, karena banyak fitur perlu lookup nama user lain.
--  Tapi minimal block akses anonim)

-- FIX 3: group_locations - fix self-reference bug
DROP POLICY IF EXISTS "Group members can view all locations in their group" 
  ON public.group_locations;
CREATE POLICY "Group members can view locations in their group" 
  ON public.group_locations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_locations gl 
      WHERE gl.group_id = group_locations.group_id 
        AND gl.user_id = auth.uid()
    ) 
    OR EXISTS (
      SELECT 1 FROM tracking_groups tg 
      WHERE tg.id = group_locations.group_id 
        AND tg.created_by = auth.uid()
    )
  );

-- FIX 4: Leaked password protection (via configure_auth tool)

-- FIX 5: Journal photos - restrict ke owner
DROP POLICY IF EXISTS "Anyone can view journal photos" ON storage.objects;
CREATE POLICY "Users can view own journal photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'journal-photos' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- FIX 6: Uploads bucket - add path ownership
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload own files" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (
    bucket_id = 'uploads' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
DROP POLICY IF EXISTS "Public can view uploads" ON storage.objects;
CREATE POLICY "Authenticated can view own uploads" ON storage.objects
  FOR SELECT TO authenticated 
  USING (
    bucket_id = 'uploads' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
```

### Tambahan:
- Aktifkan leaked password protection via `configure_auth` tool
- Update file migration `00000000000000_initial_schema.sql` agar sinkron
- Verifikasi tidak ada fitur yang break akibat perubahan profiles SELECT policy (cek komponen yang query profiles orang lain)

### Urutan:
1. Fix #1 (privilege escalation) + Fix #3 (GPS leak) — paling kritis
2. Fix #2 (profiles) — perlu cek dampak ke fitur
3. Fix #5, #6 (storage) 
4. Fix #4 (password HIBP)

