
# Rencana: Perbaikan Alur Monetisasi Premium & Pengaturan Admin

## Diagnosis Masalah

Saat ini ada **2 sistem monetisasi terpisah** yang tidak terhubung satu sama lain di dashboard admin:

1. **Membership Agen** (Free/Pro/Premium) -- untuk travel agent, dikelola di menu "Membership"
2. **Premium Tracker** (Langganan tahunan) -- untuk pengguna biasa (jamaah), dikelola di menu "Pembayaran > Premium"

Keduanya memiliki masalah:

| Masalah | Detail |
|---------|--------|
| Nama tier tidak sinkron | `membership_prices` di database menyimpan `basic/premium/enterprise`, tapi kode menggunakan `free/pro/premium` |
| Config belum tersimpan | Key `membership_config` belum pernah disimpan ke database -- masih pakai hardcoded |
| Trial 30 hari hardcoded | Durasi trial di-hardcode di `useFreeTrial.ts`, admin tidak bisa mengubah |
| Fitur premium hardcoded | Daftar fitur premium Tracker di-hardcode di `PremiumUpgradeModal.tsx` |
| Harga premium Tracker terpisah | Harga disimpan di 2 tempat: tabel `subscription_plans` (Rp 29.000) dan `platform_settings` key `subscription_price_yearly` |
| User ID saja di admin | Halaman Subscriptions hanya menampilkan user ID (UUID), bukan nama/email |
| Tidak ada pengaturan terpusat | Admin harus buka beberapa menu terpisah untuk mengatur monetisasi |

## Solusi

### 1. Perbaiki Sinkronisasi Data Membership Agen

**File**: `src/hooks/useMembershipConfig.ts`

- Saat pertama kali admin menyimpan config, pastikan key `membership_prices` diupdate dengan nama tier yang benar (`free/pro/premium`), bukan `basic/premium/enterprise`
- Ini sudah dilakukan di `useSaveMembershipConfig` -- hanya perlu memastikan tidak ada sisa data lama yang bentrok

**File**: `src/components/admin/MembershipConfigPanel.tsx`

- Tambah tombol "Reset ke Default" jika admin ingin kembali ke konfigurasi bawaan
- Tambah preview card di bawah editor agar admin bisa lihat tampilan akhir sebelum save

### 2. Pengaturan Premium Tracker yang Lengkap

Saat ini menu "Pembayaran > Premium" (`SubscriptionsManagement`) hanya bisa:
- Melihat daftar subscriber
- Mengubah harga tahunan
- Memverifikasi pembayaran

Yang perlu ditambahkan:

**File**: `src/components/admin/SubscriptionsManagement.tsx`

- **Pengaturan Plan**: Admin bisa edit nama plan, deskripsi, dan daftar fitur yang muncul di modal upgrade user
- **Durasi Trial**: Input untuk mengatur berapa hari trial gratis (default 30 hari), disimpan ke `platform_settings` key `premium_trial_config`
- **Toggle Trial**: Switch untuk mengaktifkan/menonaktifkan fitur trial gratis
- **Tampilkan Nama User**: Join query ke tabel `profiles` agar menampilkan nama & email user, bukan UUID
- **Panel Pengaturan**: Tab baru "Pengaturan" di samping daftar subscriber

**Struktur data baru di `platform_settings`**:
```text
key: "premium_trial_config"
value: {
  "enabled": true,
  "durationDays": 30,
  "features": ["Sync data ke cloud", "Backup otomatis", ...]
}

key: "premium_plan_config"  
value: {
  "name": "Premium Ibadah Tracker",
  "description": "Akses penuh fitur cloud & statistik",
  "priceYearly": 29000,
  "features": ["Sync data ke cloud", "Backup otomatis", "Akses multi-device", "Statistik lengkap", "Export data"]
}
```

### 3. Hook Trial Dinamis

**File**: `src/hooks/useFreeTrial.ts`

- Baca durasi trial dari `platform_settings` key `premium_trial_config` alih-alih hardcode 30 hari
- Jika trial dinonaktifkan admin, `startTrial` tidak bisa dipanggil
- Fallback ke 30 hari jika config belum disimpan

### 4. Modal Upgrade Dinamis

**File**: `src/components/premium/PremiumUpgradeModal.tsx`

- Baca nama plan, deskripsi, dan fitur dari `platform_settings` key `premium_plan_config` 
- Fallback ke data dari tabel `subscription_plans` jika config belum ada
- Hapus fallback hardcoded harga Rp 50.000

### 5. Trial Banner Dinamis

**File**: `src/components/premium/TrialStatusBanner.tsx`

- Jika trial dinonaktifkan admin, sembunyikan banner "Coba Premium Gratis"
- Tampilkan durasi trial sesuai setting (bukan hardcode "30 hari")

### 6. Perbaiki Query Subscriptions Admin

**File**: `src/hooks/usePremiumSubscription.ts`

- `useAllSubscriptions`: join ke `profiles` untuk ambil `full_name` dan `email`
- Tambah hook `usePremiumPlanConfig` untuk baca/simpan config plan dari `platform_settings`
- Tambah hook `usePremiumTrialConfig` untuk baca/simpan config trial

### 7. Navigasi Admin yang Lebih Jelas

**File**: `src/pages/AdminDashboard.tsx`

- Rename menu "Premium" menjadi "Langganan Tracker" agar jelas ini untuk fitur tracker
- Rename menu "Membership" tetap "Membership" (untuk agen)
- Tambah tooltip atau deskripsi singkat di sidebar

## Alur Monetisasi yang Jelas (Setelah Perbaikan)

### Alur Pengguna (Jamaah) -- Premium Tracker:
1. User membuka menu Tracker dan menggunakan fitur gratis (data tersimpan lokal)
2. Muncul banner "Coba Premium X Hari Gratis" (durasi sesuai setting admin)
3. User klik "Mulai Trial" -- data trial tersimpan di `user_subscriptions`
4. Selama trial: banner menunjukkan "Premium Trial - Sisa X hari" dengan progress bar
5. Saat trial habis: banner "Trial Berakhir" + tombol "Upgrade Premium"
6. User klik upgrade -- muncul modal dengan harga, fitur, dan metode pembayaran (semua dari database)
7. User upload bukti bayar / bayar via gateway
8. Admin verifikasi di dashboard -- status berubah jadi aktif

### Alur Agen Travel -- Membership:
1. Agen baru otomatis di tier Free (3 listing, tanpa fitur premium)
2. Agen melihat perbandingan paket Free/Pro/Premium (semua dari database via `membership_config`)
3. Agen memilih upgrade dan upload bukti bayar
4. Admin verifikasi -- membership aktif dengan batasan sesuai tier

### Pengaturan Admin Terpusat:
- **Setting > Umum & Harga**: Konfigurasi detail membership agen (harga, fitur, limits per tier)
- **Pembayaran > Langganan Tracker**: Konfigurasi plan premium tracker + trial + verifikasi subscriber
- **Pembayaran > Gateway**: Konfigurasi metode pembayaran (bank, QRIS, gateway)

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/components/admin/SubscriptionsManagement.tsx` | Redesign: tambah tab Pengaturan (plan, trial, fitur), tampilkan nama/email user |
| `src/hooks/usePremiumSubscription.ts` | Join profiles di `useAllSubscriptions`, tambah hooks config plan & trial |
| `src/hooks/useFreeTrial.ts` | Baca durasi trial dari DB, cek apakah trial enabled |
| `src/components/premium/PremiumUpgradeModal.tsx` | Baca config plan dari DB untuk nama, deskripsi, fitur |
| `src/components/premium/TrialStatusBanner.tsx` | Sembunyikan jika trial disabled, durasi dinamis |
| `src/pages/AdminDashboard.tsx` | Rename label menu "Premium" jadi "Langganan Tracker" |
| `src/components/admin/MembershipConfigPanel.tsx` | Tambah preview card paket |
