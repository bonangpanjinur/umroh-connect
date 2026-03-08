

# Analisis Bug & Rencana Perbaikan untuk Semua Role

---

## BUG KRITIS: Aplikasi Crash — AuthProvider Error

**Akar Masalah:** `vite.config.ts` baris 13 me-define `VITE_SUPABASE_ANON_KEY` dari `env.VITE_SUPABASE_ANON_KEY`, tapi file `.env` hanya punya `VITE_SUPABASE_PUBLISHABLE_KEY`. Hasilnya `undefined`, sehingga `client.ts` menggunakan placeholder URL → seluruh Supabase gagal → AuthProvider crash → **seluruh app blank/error**.

**Fix:** Update `vite.config.ts` agar mapping benar:
```
'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
  env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
)
```
Ini memastikan fallback ke `VITE_SUPABASE_PUBLISHABLE_KEY` yang memang ada di `.env`.

---

## BUG LAINNYA

| # | Severity | Bug | Lokasi | Fix |
|---|----------|-----|--------|-----|
| 1 | **Kritis** | App crash karena Supabase key undefined | `vite.config.ts` | Fallback ke PUBLISHABLE_KEY |
| 2 | **Kritis** | `loading` di-set `false` sebelum roles selesai fetch — user sempat terlihat sebagai "jamaah" | `useAuth.ts` baris 37 | Set `loading = false` hanya setelah `fetchProfileAndRoles` selesai |
| 3 | **Sedang** | Auth page tidak punya fitur "Lupa Password" | `Auth.tsx` | Tambah forgot password flow |
| 4 | **Sedang** | Setelah signup, tidak ada feedback bahwa email verifikasi terkirim | `Auth.tsx` | Tampilkan pesan konfirmasi email |
| 5 | **Sedang** | `profile.role` masih ada di Profile type tapi role sebenarnya di `user_roles` — membingungkan | `types/database.ts` | Klarifikasi bahwa `profile.role` adalah legacy |
| 6 | **Ringan** | `window.location.reload()` setelah edit profil — UX buruk | `AkunView.tsx` baris 195 | Refresh state tanpa reload page |

---

## RENCANA IMPLEMENTASI

### Task 1: Fix Supabase Connection (Kritis)
- **`vite.config.ts`**: Update define mapping agar fallback ke `VITE_SUPABASE_PUBLISHABLE_KEY`

### Task 2: Fix Auth Loading Race Condition
- **`useAuth.ts`**: Jangan set `loading = false` di `getSession().then()` sebelum `fetchProfileAndRoles` selesai
- Ubah flow: `getSession` → `fetchProfileAndRoles` → baru `setLoading(false)`
- Ini memastikan role sudah ter-load sebelum UI render, mencegah flash "jamaah" untuk admin

### Task 3: Improve Auth UX untuk Jamaah/Buyer
- **`Auth.tsx`**: Tambah tombol "Lupa Password?" yang memanggil `supabase.auth.resetPasswordForEmail()`
- Tambah feedback setelah signup: "Silakan cek email untuk verifikasi"
- Buat halaman `/reset-password` untuk set password baru setelah klik link di email

### Task 4: Perbaiki Profile Update tanpa Reload
- **`AkunView.tsx`**: Setelah update profile, re-fetch profile data via `fetchProfileAndRoles` daripada `window.location.reload()`

### Task 5: Fix Role-Based Menu Visibility
- Pastikan semua dashboard guard sudah benar:
  - Agent Dashboard: `isAgent() || isAdmin()`
  - Seller Dashboard: `isSeller() || isAdmin()`
  - Shop Admin: `isShopAdmin() || isAdmin()`
  - Admin Dashboard: `isAdmin()` only
- Ini sudah benar di `AkunView.tsx`, tapi perlu verifikasi di dashboard pages (`AgentDashboard.tsx`, `SellerDashboard.tsx`, `ShopAdminDashboard.tsx`) bahwa admin juga bisa akses

### Urutan Prioritas
1. Task 1 (fix crash) — **harus duluan, tanpa ini app tidak jalan**
2. Task 2 (loading race condition) — **penting untuk role detection**
3. Task 3 (auth UX) — fitur essential untuk jamaah
4. Task 4 & 5 — polish

