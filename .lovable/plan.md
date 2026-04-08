# Konsolidasi Migrasi Database

## Masalah
73 file migrasi terpisah di `supabase/migrations/` — banyak yang saling tumpang tindih (CREATE IF NOT EXISTS, ALTER ADD COLUMN IF NOT EXISTS, duplikat policy). Saat dipindah ke Supabase baru, urutan eksekusi bisa error.

## Rencana

### 1. Generate satu file SQL bersih dari schema aktual
- Query schema database **yang sudah jalan** (89 tabel, functions, triggers, RLS policies, storage buckets) menggunakan `pg_dump`-style approach
- Hasilkan satu file `supabase/migrations/00000000000000_initial_schema.sql` yang berisi:
  - Semua `CREATE TYPE` (enum: `app_role`, dll)
  - Semua `CREATE TABLE` dengan kolom final (bukan incremental ALTER)
  - Semua `CREATE INDEX`
  - Semua `CREATE FUNCTION` (18 functions yang ada)
  - Semua `CREATE TRIGGER`
  - Semua `ALTER TABLE ENABLE ROW LEVEL SECURITY`
  - Semua `CREATE POLICY`
  - Semua `ALTER PUBLICATION supabase_realtime` (jika ada)
  - Storage bucket setup

### 2. Hapus semua 73 file migrasi lama
- Hapus seluruh isi `supabase/migrations/`
- Ganti dengan satu file baru

### 3. Simpan backup file lama
- Pindahkan semua file lama ke `docs/migrations_backup/` sebagai referensi

## Catatan Penting
- File baru akan menggunakan `CREATE TABLE IF NOT EXISTS` dan `DROP POLICY IF EXISTS` agar idempoten
- Seed data (doa, manasik, dll) **tidak** dimasukkan ke migration — tetap di `docs/SEED_DATA_IDEMPOTENT.sql`
- File `supabase/config.toml` tidak berubah

## File yang Diubah
| Aksi | File |
|------|------|
| Hapus | 73 file di `supabase/migrations/*.sql` |
| Buat | `supabase/migrations/00000000000000_initial_schema.sql` |
| Buat | `docs/migrations_backup/` (backup file lama) |
