
# Laporan Audit & Rencana Perbaikan Komprehensif

## BUG KRITIS: Semua Fitur Database Tidak Berfungsi

### Akar Masalah
File `src/integrations/supabase/client.ts` membaca environment variable `VITE_SUPABASE_ANON_KEY`, tetapi file `.env` menyimpan key dengan nama `VITE_SUPABASE_PUBLISHABLE_KEY`. Akibatnya, seluruh aplikasi menggunakan `placeholder-key` sebagai API key, menyebabkan **semua request ke database gagal dengan error 401**.

Ini menjelaskan mengapa:
- Menu Kesehatan tidak bisa memilih jenis olahraga (data exercise_types tidak bisa diambil)
- Kategori produk tidak muncul
- Banner tidak tampil
- Semua fitur database lainnya gagal

### Perbaikan
File `client.ts` adalah file auto-generated yang tidak boleh diedit manual. Solusinya: Buat alias environment variable `VITE_SUPABASE_ANON_KEY` yang mengarah ke key yang sama di `supabaseConfig.ts` atau file bootstrap, ATAU hubungi support Lovable Cloud untuk regenerasi file `.env` dengan nama variable yang benar.

**Solusi praktis**: Tambahkan file `src/supabaseConfig.ts` yang sudah ada untuk meng-export env variable yang benar, lalu pastikan client.ts membaca dari sumber yang tepat.

Namun karena `client.ts` auto-generated, pendekatan yang benar adalah menambahkan `VITE_SUPABASE_ANON_KEY` ke `.env` sebagai duplikat dari `VITE_SUPABASE_PUBLISHABLE_KEY`.

Catatan: `.env` juga auto-generated. Kita perlu menyelidiki apakah ada cara lain. **Alternatif terbaik**: Override di `src/supabaseConfig.ts` yang sudah ada dan pastikan import path mengarah ke sana.

Setelah diperiksa ulang, ternyata `.env` memiliki `VITE_SUPABASE_PUBLISHABLE_KEY` dan `client.ts` membaca `VITE_SUPABASE_ANON_KEY` -- keduanya auto-generated. Ini kemungkinan bug konfigurasi Lovable Cloud. Solusi sementara yang paling aman: buat wrapper client di `src/lib/supabase.ts` yang membuat client baru dengan key yang benar.

---

## Bug Lainnya yang Ditemukan

### BUG 2: `src/lib/supabase.ts` Hanya Re-export Client yang Broken
File ini me-redirect ke `client.ts` yang menggunakan placeholder key. Perlu diubah menjadi client mandiri yang membaca env variable yang benar (`VITE_SUPABASE_PUBLISHABLE_KEY`).

### BUG 3: Kategori Produk Kosong di Database
Tabel `shop_categories` memiliki 0 record. Bahkan setelah API key diperbaiki, admin tidak akan melihat kategori apapun. Perlu seed data awal.

### BUG 4: Travel Form -- RLS INSERT Policy
Policy INSERT pada `travels` menggunakan `qual: nil` (no restriction check), tapi memerlukan role check via `with_check`. Admin bisa menambah travel, tapi perlu dipastikan `owner_id` terisi dengan profile ID yang valid.

---

## Audit Fitur per Role

### ADMIN (Super Admin)
| Fitur | Status | Masalah |
|-------|--------|---------|
| Overview/Analitik | Broken | API key 401 |
| Users Management | Broken | API key 401 |
| Travels Management | Broken | API key 401 + owner_id perlu profile.id |
| Banner Management | OK (kode) | Sudah pakai ImageUpload, tapi 401 |
| Kategori Produk | Broken | Data kosong + 401 |
| Quran Management | Broken | 0 ayat + 401 |
| Doa Management | OK (kode) | Tergantung seed data |
| Seller Management | OK (kode) | 401 |

### SELLER
| Fitur | Status | Masalah |
|-------|--------|---------|
| Produk CRUD | OK (kode) | RLS SELECT sudah ada |
| Pesanan | OK (kode) | RLS SELECT seller sudah ditambah |
| Chat | OK (kode) | - |
| Statistik | OK (kode) | - |
| Duplikat Produk | Fixed | Slug unik sudah diperbaiki |

### AGENT
| Fitur | Status | Masalah |
|-------|--------|---------|
| Travel Form | Perlu perbaikan | owner_id menggunakan profile.id tapi AddTravelForm admin juga set owner_id ke profile.id admin, bukan agent yang dipilih |
| Package CRUD | OK (kode) | - |
| Booking | OK (kode) | - |
| Analytics | OK (kode) | - |

### BUYER (Jamaah)
| Fitur | Status | Masalah |
|-------|--------|---------|
| Browse Produk | Broken | 401 |
| Keranjang/Checkout | OK (kode) | - |
| Riwayat Pesanan | OK (kode) | Chat sudah bisa di status pending |
| Order Timeline | OK (kode) | Trigger + history table ada |
| Tracker Kesehatan | Broken | Exercise types 401 |
| Meal Tracking | OK | Local storage, tidak butuh DB |

---

## Rencana Perbaikan

### 1. Perbaiki Koneksi Database (KRITIS)
Ubah `src/lib/supabase.ts` dari re-export menjadi client mandiri yang membaca `VITE_SUPABASE_PUBLISHABLE_KEY` langsung. Semua import di aplikasi yang menggunakan `src/lib/supabase` akan otomatis terperbaiki.

Untuk file yang import dari `@/integrations/supabase/client`, buat re-export di sana juga yang menggunakan env var yang benar.

**File yang diubah:**
- `src/lib/supabase.ts` -- buat client baru dengan `VITE_SUPABASE_PUBLISHABLE_KEY`

### 2. Seed Data Kategori Produk
Tambahkan kategori produk default melalui migration SQL:
- Oleh-oleh Makanan
- Perlengkapan Ibadah
- Pakaian & Aksesoris
- Buku & Media
- Parfum & Skincare

### 3. Perbaiki AddTravelForm untuk Admin
Saat admin menambah travel dan memilih owner agent, `owner_id` harus diisi dengan **profile.id agent yang dipilih**, bukan profile.id admin. Saat ini `useCreateTravel` selalu menggunakan `profile.id` dari user yang login (admin).

**Perbaikan:** Buat hook `useAdminCreateTravel` terpisah di `useAdminData.ts` yang menerima `owner_id` sebagai parameter tanpa override.

### 4. Perbaiki OlahragaView -- Fallback untuk Data Kosong
Tambahkan daftar olahraga default di frontend sebagai fallback ketika data dari database belum tersedia, agar pengguna tetap bisa input olahraga.

### 5. Tambah Tab "Diet" di Menu Kesehatan
Saat ini tab Kesehatan hanya menampilkan OlahragaView. Tambahkan sub-tab yang juga menampilkan MealTrackingView agar kedua fitur terintegrasi dalam satu tab.

### Detail Teknis

| No | File | Perubahan |
|----|------|-----------|
| 1 | `src/lib/supabase.ts` | Buat client dengan `VITE_SUPABASE_PUBLISHABLE_KEY` dan `VITE_SUPABASE_URL` langsung |
| 2 | SQL Migration | Seed kategori produk default |
| 3 | `src/hooks/useAgentData.ts` | Tambah `useAdminCreateTravel` yang terima owner_id parameter |
| 4 | `src/components/admin/AddTravelForm.tsx` | Gunakan `useAdminCreateTravel` |
| 5 | `src/components/habit/OlahragaView.tsx` | Tambah fallback exercise types + sub-tabs kesehatan |
| 6 | `src/components/habit/IbadahHubView.tsx` | Tab Kesehatan menampilkan sub-tabs (Olahraga + Diet) |
