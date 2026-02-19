
# Rencana: Pengaturan Membership Lengkap & Dinamis

## Masalah Saat Ini

Saat ini hanya **harga** membership yang bisa diatur dari admin (disimpan di `platform_settings` dengan key `membership_prices`). Namun **fitur-fitur** dan **batasan** setiap paket (seperti jumlah listing, template, kredit, akses chat, dll) masih di-hardcode di kode (`useAgentMembership.ts`). Artinya admin tidak bisa mengubah isi paket tanpa mengubah kode.

## Solusi

Simpan seluruh konfigurasi membership (harga + fitur + limits) ke database di `platform_settings` dengan key baru `membership_config`, lalu buat panel admin khusus untuk mengelolanya.

## Detail Teknis

### 1. Struktur Data Baru di Database

Akan menyimpan satu key baru `membership_config` di tabel `platform_settings` yang berisi array lengkap ketiga tier:

```text
{
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "badge": "",
      "features": ["Listing 3 paket per bulan", "Tampil standar", "Akses dasar dashboard"],
      "limits": {
        "maxPackages": 3,
        "maxTemplates": 0,
        "monthlyCredits": 0,
        "hasWebsite": false,
        "hasPrioritySearch": false,
        "hasChat": false,
        ...
      }
    },
    { "id": "pro", ... },
    { "id": "premium", ... }
  ]
}
```

### 2. Panel Admin: Pengaturan Membership (Komponen Baru)

Mengganti bagian "Harga Keanggotaan" yang sederhana di `PlatformSettings.tsx` dengan panel konfigurasi lengkap. Setiap tier (Free / Pro / Premium) akan memiliki:

- **Harga** (input angka)
- **Badge** (input teks, contoh: "Pro", "Verified")
- **Daftar Fitur** (textarea, satu fitur per baris -- ini yang tampil di card perbandingan)
- **Batasan Angka**: Max Listing Paket, Max Template, Kredit Bulanan
- **Batasan Fitur (toggle on/off)**:
  - Akses Website
  - Prioritas Pencarian
  - Chat Jamaah
  - Statistik Leads
  - Badge Verified
  - Top Listing
  - Data Jamaah
  - Support Prioritas
  - Analitik Advanced

Panel ini akan menggunakan Accordion/Tabs per tier agar tidak terlalu panjang.

### 3. Hook Baru: `useMembershipConfig`

Hook baru di `src/hooks/useMembershipConfig.ts` yang:
- Membaca `membership_config` dari `platform_settings`
- Jika belum ada di database, fallback ke MEMBERSHIP_PLANS hardcoded (backward compatible)
- Mengembalikan array `MembershipPlan[]` yang sudah merged
- Digunakan oleh seluruh sistem (MembershipsManagement, AgentMembershipCard, PlanComparisonCards, dll)

### 4. File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/hooks/useMembershipConfig.ts` | **Baru** -- hook untuk baca config dari DB |
| `src/components/admin/PlatformSettings.tsx` | Ganti card harga sederhana dengan panel konfigurasi lengkap per tier |
| `src/hooks/useAgentMembership.ts` | `useIsAgentPro` dan `getPlanById` menggunakan data dari `useMembershipConfig` alih-alih hardcoded |
| `src/components/admin/MembershipsManagement.tsx` | Gunakan `useMembershipConfig` menggantikan `getMergedPlans` lokal |

### 5. Alur Kerja Admin

1. Admin buka **Pengaturan > Umum & Harga**
2. Terlihat 3 card (Free / Pro / Premium) masing-masing bisa di-expand
3. Admin ubah harga, fitur, atau batasan sesuai kebutuhan
4. Klik **Simpan** -- data tersimpan ke `platform_settings` dengan key `membership_config`
5. Seluruh halaman yang menampilkan paket membership (card perbandingan, upgrade modal, dashboard agent) otomatis menggunakan data terbaru dari database

### 6. Backward Compatibility

- Key lama `membership_prices` tetap dibaca sebagai fallback jika `membership_config` belum ada
- Hardcoded `MEMBERSHIP_PLANS` tetap ada sebagai fallback paling akhir
- Prioritas: `membership_config` > `membership_prices` > hardcoded
