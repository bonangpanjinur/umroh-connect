

# Perbaikan Sistem Role: Multi-Role dari `user_roles` Table

## Akar Masalah

`useAuth.ts` membaca role dari `profiles.role` yang default-nya selalu `'jamaah'`. Padahal role admin disimpan di tabel `user_roles` yang terpisah. Akibatnya, admin selalu terdeteksi sebagai jamaah.

## Rencana Perbaikan

### Task 1: Update `useAuth.ts` -- Fetch Roles dari `user_roles` Table

- Tambah state `roles: AppRole[]` yang di-fetch dari tabel `user_roles`
- `fetchProfile` juga fetch semua role dari `user_roles` WHERE `user_id`
- Update `hasRole()` untuk cek dari array `roles` (bukan `profile?.role`)
- Support multi-role: user bisa punya role `admin` + `agent` sekaligus
- `isAdmin()` cek `roles.includes('admin')`

### Task 2: Update `AuthContext.tsx` -- Expose `roles` Array

- Tambah `roles: AppRole[]` ke interface `AuthContextType`

### Task 3: Update `AkunView.tsx` -- Multi-Role Dashboard Buttons

- Ganti semua pengecekan `profile?.role === 'admin'` dengan `isAdmin()`
- `isAgentOrAdmin` pakai `isAgent() || isAdmin()`
- Role label di profil header tampilkan role tertinggi atau gabungan (Admin > Agent > Shop Admin > Seller > Jamaah)
- Admin melihat SEMUA tombol dashboard (Agent, Seller, Shop Admin, Admin)

### Task 4: Update Role Display

- Tampilkan badge multi-role jika user punya lebih dari 1 role
- Contoh: "Admin • Agent" bukan hanya "Jamaah"

## File yang Diubah

1. `src/hooks/useAuth.ts` -- fetch dari `user_roles`, multi-role support
2. `src/contexts/AuthContext.tsx` -- expose `roles`
3. `src/components/akun/AkunView.tsx` -- gunakan `isAdmin()` konsisten, tampilkan semua dashboard untuk admin

