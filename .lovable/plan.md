

# Analisis Lengkap: Bug, Fitur Kurang, Peluang Pengembangan, dan UX Jamaah/Buyer

---

## BAGIAN A: BUG YANG DITEMUKAN

| # | Severity | Bug | Lokasi | Detail |
|---|----------|-----|--------|--------|
| 1 | **Kritis** | `AppRole` type tidak include `super_admin` | `src/types/database.ts:3` | Type hanya `'jamaah' \| 'agent' \| 'admin' \| 'shop_admin' \| 'seller'` -- `hasRole('super_admin' as AppRole)` melakukan type cast paksa. Jika di DB ada role `super_admin`, TypeScript tidak mengenalinya. |
| 2 | **Kritis** | `handleSaveProfile` mutasi langsung ke object reference tanpa trigger re-render | `AkunView.tsx:196` | `(profile as any).full_name = editName.trim()` -- mutasi langsung tanpa `setProfile`, UI tidak update karena React tidak mendeteksi perubahan state. |
| 3 | **Sedang** | `onAuthStateChange` callback fetch roles via `setTimeout(0)` -- bisa race condition | `useAuth.ts:20-22` | Jika user navigasi cepat sebelum setTimeout callback execute, roles belum tersedia dan user terlihat sebagai jamaah sesaat. |
| 4 | **Sedang** | Profile type tidak match kolom DB | `types/database.ts` vs `ProfileDetailForm.tsx` | Profile type tidak punya field `shipping_address`, `passport_number`, dll. ProfileDetailForm cast `profile as any` untuk akses field-field ini -- tidak type-safe. |
| 5 | **Sedang** | Seller Dashboard tidak cek role -- hanya cek `user` | `SellerDashboard.tsx:43` | Admin yang buka Seller Dashboard tapi bukan seller akan lihat form "Daftar Seller" bukan dashboard. Seharusnya admin bypass ini. |
| 6 | **Ringan** | ServiceWorker registration error di dev mode | Console logs | `dev-sw.js` redirect error -- tidak kritis tapi spam console. |
| 7 | **Ringan** | `PaketView` fallback ke `mockData` jika DB kosong | `PaketView.tsx:39-40` | Mock data ditampilkan tanpa indikasi -- user bisa bingung kenapa paket ini tidak bisa di-booking. |

---

## BAGIAN B: FITUR YANG KURANG (Essential)

### Untuk Jamaah/Buyer:

1. **Order History di Shop tidak accessible dari Akun** -- User harus buka Shop tab lalu cari order history. Seharusnya ada shortcut di halaman Akun.
2. **Wishlist tidak ada akses cepat** -- Wishlist tersembunyi di dalam tab Shop.
3. **Tidak ada notifikasi booking/payment reminder di home** -- User harus buka Akun > Booking untuk lihat status.
4. **Tidak ada halaman "Riwayat Transaksi" terpusat** -- Booking umroh dan order shop terpisah, tidak ada unified view.
5. **Profile foto belum bisa upload** -- Avatar hanya placeholder icon, tidak ada fitur upload foto profil.
6. **Checkout tidak auto-fill dari profile** -- Form checkout tidak pre-fill data dari `ProfileDetailForm` (alamat, telepon).
7. **Cart badge/counter tidak ada di BottomNav Shop icon** -- User tidak tahu ada berapa item di keranjang.

### Untuk Semua Role:

8. **Tidak ada "Refresh Profile" exposed** -- Setelah admin assign role baru, user harus logout-login untuk melihat perubahan.
9. **Admin Dashboard tidak ada user role management** -- `UsersManagement.tsx` ada tapi tidak jelas apakah bisa assign/remove roles dari `user_roles` table.

---

## BAGIAN C: FITUR YANG BISA DIKEMBANGKAN

1. **Notifikasi Push untuk status booking** -- Integrasikan dengan `send-push-notification` edge function untuk update status booking.
2. **Reward/Loyalty Points** -- Jamaah yang sudah selesai umroh bisa dapat poin untuk diskon di shop.
3. **Referral System** -- Jamaah bisa referral teman, dapat kredit.
4. **Live Chat antara jamaah dan agent** -- ChatView sudah ada tapi integrasi ke flow booking bisa diperdalam.
5. **Travel Review setelah pulang** -- Otomatis prompt review setelah return_date lewat.
6. **Progress Persiapan visual di Home** -- Percentage bar checklist persiapan di home card.
7. **Integrasi Payment Gateway** -- Midtrans sudah ada tapi belum lengkap untuk semua flow.
8. **Multi-bahasa lebih lengkap** -- LanguageContext sudah ada tapi banyak string masih hardcode bahasa Indonesia.

---

## BAGIAN D: ANALISIS UX UNTUK JAMAAH/BUYER

### Masalah UX Saat Ini:

1. **Informasi penting tersembunyi** -- Status booking, payment due, order shop semua di halaman berbeda. Jamaah harus navigasi banyak langkah.
2. **Home terlalu padat** -- PrayerTimeCard + Ramadan Banner + Countdown + UmrahQuickCard + Quick Access + QuickMenu + FeaturedPackages + PromoBanner + Timeline = **8+ section** di satu halaman scroll.
3. **Tidak ada onboarding flow** -- User baru langsung dihadapkan semua fitur tanpa guidance.
4. **Booking flow terlalu dalam** -- Paket > Detail > Pilih Departure > Form Booking = 4 langkah. Tidak ada progress indicator.
5. **Shop tidak ada "Recently Viewed"** -- User harus search ulang produk yang pernah dilihat.
6. **BottomNav tidak ada badge** -- Tidak ada visual cue untuk unread notifications, cart items, atau pending payments.

---

## RENCANA IMPLEMENTASI (Prioritas Tinggi)

### Task 1: Fix Bug Kritis
- Tambah `'super_admin'` ke `AppRole` type di `types/database.ts`
- Fix `handleSaveProfile` di `AkunView.tsx` -- gunakan state update bukan mutasi langsung
- Fix `onAuthStateChange` -- ganti `setTimeout(0)` dengan direct async call (tapi tanpa await karena Supabase docs requirement)

### Task 2: Tambah Shortcuts Jamaah di Halaman Akun
- Tambah tombol "Riwayat Pesanan Shop" di section Akun
- Tambah tombol "Wishlist" di section Akun
- Tambah badge pending payment di Booking button

### Task 3: Cart Badge di BottomNav
- Tambah cart item count badge di icon Shop di BottomNav
- Gunakan `useShopCart` untuk count, tapi lazy-load (hanya jika user login)

### Task 4: Profile Photo Upload
- Gunakan `ImageUpload` component + storage bucket `uploads`
- Update avatar di `profiles` table
- Tampilkan di header Akun

### Task 5: Auto-fill Checkout dari Profile
- Di `CheckoutView`, pre-populate name, phone, address dari profile data
- Hemat waktu user yang sudah lengkapi profil

### Task 6: Seller Dashboard Admin Bypass
- Di `SellerDashboard.tsx`, jika `isAdmin()` dan bukan seller, tampilkan overview/management view bukan form daftar seller

