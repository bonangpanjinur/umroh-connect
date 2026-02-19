
# Rencana Perbaikan & Penyempurnaan Sistem (9 Poin)

## 1. Link Pendaftaran Seller di Admin Dashboard

**Masalah**: Admin tidak bisa membagikan link pendaftaran khusus seller. Form pendaftaran hanya muncul jika user sudah login dan membuka /seller.

**Solusi**:
- Tambah halaman publik `/daftar-seller` yang bisa diakses tanpa login (redirect ke /auth dulu jika belum login, lalu kembali ke form)
- Di `SellerManagement.tsx`, tambah card di bagian atas dengan URL pendaftaran yang bisa di-copy admin
- Tombol "Salin Link Pendaftaran" yang menyalin URL `{origin}/daftar-seller`
- Buat route baru di `App.tsx` untuk `/daftar-seller`

**File yang diubah**:
- `src/App.tsx` -- tambah route `/daftar-seller`
- `src/components/admin/SellerManagement.tsx` -- tambah card link pendaftaran dengan tombol copy
- Buat `src/pages/SellerRegistration.tsx` -- halaman publik pendaftaran seller

---

## 2. Pengaturan Membership Dinamis

**Masalah**: Data membership (MEMBERSHIP_PLANS) di-hardcode di `useAgentMembership.ts` dengan harga tetap (Free/Pro Rp2jt/Premium Rp7.5jt). Tidak bisa diubah dari admin. `PlatformSettings` punya field harga membership tapi dengan nama tier berbeda (basic/premium/enterprise) dan tidak sinkron dengan MEMBERSHIP_PLANS.

**Solusi**:
- Sinkronkan nama tier di PlatformSettings agar sesuai: Free, Pro, Premium
- Buat `MEMBERSHIP_PLANS` membaca harga dari `platform_settings` (key: `membership_prices`) sehingga admin bisa mengubah harga
- Tambah pengaturan fitur/limit per tier yang bisa diedit admin (maxPackages, maxTemplates, dll)
- Buat komponen `MembershipConfigPanel` di admin settings dengan editor lengkap per tier

**File yang diubah**:
- `src/hooks/useAgentMembership.ts` -- tambah hook untuk baca harga dari DB, fallback ke hardcoded
- `src/components/admin/PlatformSettings.tsx` -- perbaiki label tier (Free/Pro/Premium), tambah editor limit per tier
- `src/components/admin/MembershipsManagement.tsx` -- gunakan harga dinamis

---

## 3. Tema Default Terang (Light)

**Masalah**: Default tema adalah `system`, yang bisa menjadi gelap jika perangkat user menggunakan dark mode.

**Solusi**:
- Ubah default di `ThemeContext.tsx` dari `'system'` menjadi `'light'`
- User yang sudah memilih tema sebelumnya tidak akan terpengaruh (tersimpan di localStorage)

**File yang diubah**:
- `src/contexts/ThemeContext.tsx` -- ubah `return stored || 'system'` menjadi `return stored || 'light'`

---

## 4. Alur Premium 30 Hari di Tracker

**Masalah**: `useFreeTrial.ts` sudah ada logika trial 30 hari, tapi alurnya tidak jelas di UI. User tidak tahu kapan trial dimulai, berapa sisa hari, dan apa yang terjadi setelah expired.

**Solusi**:
- Di `IbadahHubView.tsx` atau area tracker, tambah banner yang jelas:
  - Jika belum pernah trial: tampilkan CTA "Coba Premium 30 Hari Gratis" dengan penjelasan manfaat
  - Jika sedang trial: tampilkan "Premium Trial - Sisa X hari" dengan progress bar
  - Jika trial expired: tampilkan "Trial Berakhir" dengan tombol upgrade ke Premium berbayar
- Hubungkan dengan `useFreeTrial.startTrial` dan `PremiumUpgradeModal`

**File yang diubah**:
- `src/components/habit/IbadahHubView.tsx` -- tambah banner trial status
- Buat `src/components/premium/TrialStatusBanner.tsx` -- komponen reusable untuk status trial

---

## 5. Manajemen Pengguna: Tampilkan Email & Detail Lengkap

**Masalah**: Tabel user di admin hanya menampilkan Nama, Telepon, Role, Status, Terdaftar. Email tidak ditampilkan karena kolom `email` tidak ada di tabel `profiles`.

**Solusi**:
- Tambah kolom `email` ke tabel `profiles` via migration
- Update trigger `handle_new_user()` untuk menyimpan email dari `auth.users`
- Backfill email dari `auth.users` ke `profiles` yang sudah ada
- Tampilkan email di tabel admin dengan layout yang lebih readable
- Tambah kolom Aksi yang lebih compact, gunakan ikon saja di mobile
- Gunakan layout responsive: card-based di mobile, tabel di desktop

**File yang diubah**:
- Database migration -- tambah kolom email, update trigger, backfill data
- `src/components/admin/UsersManagement.tsx` -- tambah kolom email, perbaiki layout tabel
- `src/types/database.ts` -- update type Profile

---

## 6. Sinkronisasi Pengaturan Global dengan Menu

**Masalah**: `PlatformSettings` punya pengaturan harga membership (basic/premium/enterprise) yang berbeda nama tier dengan `MEMBERSHIP_PLANS` (free/pro/premium). Pengaturan whitelabel (site_name, primary_color) tidak digunakan secara global di header/footer.

**Solusi**:
- Buat hook `usePlatformConfig` yang membaca `whitelabel_settings` dan dipakai di `AppHeader`, footer, dll
- Pastikan nama tier konsisten di seluruh sistem
- Site name dari whitelabel muncul di header, splash screen, dan judul halaman
- Primary color dari whitelabel diterapkan ke CSS variable jika diubah

**File yang diubah**:
- Buat `src/hooks/usePlatformConfig.ts` -- hook baru untuk baca whitelabel settings
- `src/components/layout/AppHeader.tsx` -- gunakan site_name dari settings
- `src/components/admin/PlatformSettings.tsx` -- sinkronkan label tier

---

## 7. Dashboard Store Khusus

**Masalah**: `ShopAdminDashboard` (`/shop-admin`) hanya me-reuse komponen yang sama persis dari Admin Dashboard (ShopProductsManagement, ShopCategoriesManagement, dll). Tidak ada fitur khusus shop admin seperti seller management atau laporan toko.

**Solusi**:
- Redesign `/shop-admin` sebagai dashboard toko yang independen dengan sidebar layout seperti Admin
- Tambah fitur khusus: Seller Management, laporan pendapatan toko, manajemen promo/diskon
- Tambah statistik toko: total produk, total pesanan hari ini, pendapatan bulan ini, seller aktif
- Navigasi sidebar: Overview, Produk, Kategori, Pesanan, Seller, Laporan

**File yang diubah**:
- `src/pages/ShopAdminDashboard.tsx` -- redesign dengan sidebar layout dan fitur tambahan

---

## 8. Template Builder: Perbaikan Drag & Drop

**Masalah**: `VisualBlockBuilder.tsx` sudah menggunakan `@dnd-kit` untuk drag & drop. Namun UX-nya bisa ditingkatkan: tidak ada visual feedback saat drag, tidak ada insert-between indicator, dan blok baru selalu ditambah di akhir.

**Solusi**:
- Tambah visual drag overlay menggunakan `DragOverlay` dari dnd-kit
- Tambah insert indicator line (garis biru) antara blok saat drag untuk menunjukkan posisi drop
- Tambah kemampuan drag dari panel "Tambah Blok" ke posisi tertentu di daftar blok
- Tambah animasi smooth saat reorder
- Preview blok saat hover di panel tambah blok
- Perbaiki responsiveness: pada mobile, panel editor muncul sebagai sheet dari bawah

**File yang diubah**:
- `src/components/blocks/VisualBlockBuilder.tsx` -- tambah DragOverlay, insert indicator, animasi

---

## 9. Analisis & Perbaikan Payment Gateway

**Temuan kekurangan**:
1. **QRIS hanya URL manual** -- Tidak bisa upload gambar langsung, harus paste URL. Sebaiknya tambah fitur upload langsung ke storage.
2. **Tidak ada instruksi pembayaran** -- Setiap metode bank tidak punya field instruksi khusus (contoh: "Transfer ke rekening BCA atas nama...").
3. **Tidak ada batas waktu pembayaran** -- Tidak ada setting berapa jam/hari deadline pembayaran setelah order.
4. **Tidak ada notifikasi admin** -- Saat user upload bukti bayar, admin tidak mendapat notifikasi.
5. **E-Wallet belum ada flow** -- E-wallet (GoPay/OVO/DANA) toggle-nya ada tapi tidak ada mekanisme verifikasi/pembayaran di sisi user.
6. **API Key tersimpan di platform_settings** -- API key Midtrans/Xendit disimpan sebagai plain text di platform_settings (tabel biasa), bukan di secrets/vault. Ini risiko keamanan.

**Solusi**:
- Tambah upload QRIS ke storage bucket dengan komponen ImageUpload
- Tambah field `instructions` per metode pembayaran (textarea)
- Tambah setting `payment_deadline_hours` (default: 24 jam) 
- Tambah info deadline di checkout
- Tambah warning banner bahwa API key sebaiknya disimpan di environment variable/secrets, bukan di database

**File yang diubah**:
- `src/components/admin/PaymentGatewaySettings.tsx` -- tambah upload QRIS, instruksi per metode, deadline setting
- `src/components/shop/CheckoutView.tsx` -- tampilkan deadline pembayaran

---

## Ringkasan Prioritas Implementasi

| No | Poin | Kompleksitas | Prioritas |
|----|------|-------------|-----------|
| 3 | Tema default terang | Rendah | Tinggi |
| 5 | Email di user management | Sedang | Tinggi |
| 1 | Link pendaftaran seller | Sedang | Tinggi |
| 2 | Membership dinamis | Tinggi | Tinggi |
| 6 | Sinkronisasi global-menu | Sedang | Sedang |
| 4 | Alur trial premium | Sedang | Sedang |
| 9 | Perbaikan payment gateway | Sedang | Sedang |
| 7 | Dashboard store khusus | Tinggi | Sedang |
| 8 | Drag & drop template | Tinggi | Rendah |

Implementasi akan dilakukan bertahap sesuai prioritas. Setiap tahap akan menghasilkan perubahan yang bisa langsung diuji.
