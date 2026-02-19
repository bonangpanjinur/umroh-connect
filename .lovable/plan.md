
# Rencana: Pengelolaan Al-Quran di Dashboard Admin

## Ringkasan

Saat ini, teks Al-Quran (Arab + terjemahan) diambil langsung dari API eksternal `api.alquran.cloud` setiap kali user membuka surah. Ini berarti:
- Bergantung penuh pada API eksternal (jika down, Quran tidak bisa dibaca)
- Lambat karena setiap surah perlu 2 request (Arab + terjemahan)
- Admin tidak punya kontrol atas konten

Solusi: Simpan semua ayat di database internal, buat mekanisme sinkronisasi, dan tambah halaman admin untuk mengelolanya.

## Arsitektur

### Database

**Tabel baru: `quran_ayahs`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| surah_number | INTEGER | Nomor surat (1-114) |
| ayah_number | INTEGER | Nomor ayat dalam surat |
| ayah_global | INTEGER | Nomor ayat global (1-6236) |
| arabic_text | TEXT | Teks Arab |
| translation_id | TEXT | Terjemahan Indonesia |
| juz | INTEGER | Nomor juz |
| page | INTEGER | Nomor halaman mushaf |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

- Index unik pada (surah_number, ayah_number)
- RLS: public read, admin-only write

**Kolom baru di `quran_surahs`**:
- `revelation_type` (TEXT) -- Makkiyah/Madaniyah
- `english_name` (TEXT) -- Nama dalam bahasa Inggris
- `translation_name` (TEXT) -- Arti nama surat

**Tabel baru: `quran_sync_logs`**

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| sync_type | TEXT | 'full' atau 'partial' |
| surahs_synced | INTEGER | Jumlah surat yang disinkron |
| ayahs_synced | INTEGER | Jumlah ayat yang disinkron |
| status | TEXT | 'running', 'completed', 'failed' |
| error_message | TEXT | Pesan error jika gagal |
| started_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |

### Edge Function: `sync-quran-data`

- Menerima parameter: `mode` ('full' | 'surah'), `surah_number` (opsional)
- Mode full: loop surat 1-114, fetch dari Al-Quran Cloud API (Arab + terjemahan Indonesia), simpan ke `quran_ayahs` via upsert
- Mode surah: sync satu surat tertentu saja
- Catat progress di `quran_sync_logs`
- Hanya admin yang bisa memanggil

### Komponen Admin: `QuranManagement.tsx`

Tab-based layout:

**Tab 1 - Status Data**
- Statistik: total ayat tersimpan (target 6.236), total surat (target 114), terakhir sync
- Progress bar per-surat (hijau = lengkap, abu = belum)
- Tombol "Sinkronisasi Penuh" dan "Sinkronisasi Ulang Surat [X]"
- Log riwayat sinkronisasi dari `quran_sync_logs`

**Tab 2 - Daftar Surat**
- Tabel 114 surat: nomor, nama Arab, nama Inggris, jumlah ayat, status data (lengkap/tidak)
- Klik surat untuk melihat detail ayat
- Tombol sync per-surat

**Tab 3 - Editor Ayat**
- Pilih surat, lalu tampilkan daftar ayat
- Admin bisa mengedit teks Arab atau terjemahan jika ada koreksi
- Perubahan langsung disimpan ke `quran_ayahs`

### Perubahan pada QuranView

- Hook baru `useQuranLocal` yang prioritaskan data dari `quran_ayahs`
- Jika data lokal ada, gunakan langsung (tanpa API call)
- Jika data lokal belum ada, fallback ke API eksternal seperti saat ini
- Ini menjamin backward compatibility

### Navigasi Admin

- Tambah menu "Al-Quran" di grup "Konten" pada sidebar admin (icon: Book)

## File yang Dibuat/Diubah

| File | Aksi | Keterangan |
|------|------|------------|
| Migration SQL | Baru | Tabel `quran_ayahs`, `quran_sync_logs`, kolom baru di `quran_surahs` |
| `supabase/functions/sync-quran-data/index.ts` | Baru | Edge function untuk fetch dan simpan data dari API |
| `src/components/admin/QuranManagement.tsx` | Baru | Halaman admin pengelolaan Al-Quran |
| `src/hooks/useQuranLocal.ts` | Baru | Hook untuk baca ayat dari database lokal dengan fallback API |
| `src/hooks/useQuranAdmin.ts` | Baru | Hook untuk admin: statistik, trigger sync, edit ayat |
| `src/components/quran/QuranView.tsx` | Ubah | Gunakan `useQuranLocal` sebagai sumber data utama |
| `src/pages/AdminDashboard.tsx` | Ubah | Tambah menu "Al-Quran" di sidebar dan render `QuranManagement` |

## Detail Teknis

### Edge Function `sync-quran-data`
- Memanggil `api.alquran.cloud/v1/surah/{n}` untuk teks Arab
- Memanggil `api.alquran.cloud/v1/surah/{n}/id.indonesian` untuk terjemahan
- Upsert ke `quran_ayahs` berdasarkan (surah_number, ayah_number)
- Update metadata di `quran_surahs` (revelation_type, english_name, translation_name)
- Rate limit: delay 500ms antar surat untuk menghindari throttling API

### Hook `useQuranLocal`
```text
1. Query quran_ayahs WHERE surah_number = X
2. Jika hasil > 0 -> return data lokal
3. Jika hasil = 0 -> fallback ke useQuranAPI (fetch dari API eksternal)
```

### Alur Sinkronisasi Admin
```text
Admin klik "Sinkronisasi Penuh"
  -> Insert quran_sync_logs (status: running)
  -> Panggil edge function sync-quran-data (mode: full)
  -> Edge function loop 114 surat, fetch + upsert
  -> Update quran_sync_logs (status: completed, ayahs_synced: 6236)
  -> Admin melihat progress bar berubah hijau
```
