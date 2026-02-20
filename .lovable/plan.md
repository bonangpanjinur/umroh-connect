
# Rencana: Tambah Dashboard Store di Halaman Akun

## Ringkasan

Menambahkan tombol "Dashboard Store" di halaman Akun untuk user yang memiliki role `seller` atau memiliki profil seller aktif. Konsepnya sama persis dengan tombol "Dashboard Agent" yang sudah ada.

## Perubahan

### 1. AuthContext & useAuth - Tambah helper `isSeller()`

Menambahkan fungsi `isSeller()` di `useAuth.ts` dan `AuthContext.tsx`, sama seperti `isAgent()`, `isAdmin()`, dll.

### 2. AkunView.tsx - Tambah tombol Dashboard Store

Menambahkan tombol navigasi ke `/seller` tepat setelah tombol Agent Dashboard, dengan kondisi tampil jika:
- `profile?.role === 'seller'`, ATAU
- User memiliki `sellerProfile` aktif (dari hook `useSellerProfile`)

Tombol akan menggunakan warna oranye dengan ikon `Store`, menampilkan nama toko dari `sellerProfile` jika tersedia.

## Detail Teknis

| File | Aksi | Keterangan |
|------|------|------------|
| `src/hooks/useAuth.ts` | Ubah | Tambah `isSeller()` helper |
| `src/contexts/AuthContext.tsx` | Ubah | Expose `isSeller` di context type |
| `src/components/akun/AkunView.tsx` | Ubah | Tambah tombol "Dashboard Store" dengan import `useSellerProfile`, tampil jika user adalah seller |

### Logika Tampil Tombol

```text
Tampilkan "Dashboard Store" jika:
  - profile.role === 'seller'
  - ATAU useSellerProfile() mengembalikan data (user sudah terdaftar sebagai seller)
```

### Desain Tombol

Mengikuti pola yang sama dengan Agent Dashboard button:
- Warna: oranye (orange-500)
- Ikon: Store
- Judul: "Dashboard Store" 
- Subtitle: nama toko dari sellerProfile, atau "Kelola produk & penjualan Anda"
- Navigasi ke: `/seller`
