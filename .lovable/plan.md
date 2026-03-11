

# Rencana Perbaikan: Susun Menu & UI/UX

## Masalah Utama

### Home Screen — Dua Grid Ikon Terpisah, Membingungkan
Saat ini ada **dua grid menu** di home:
1. **Quick Access** (4 ikon besar bergradien): Manasik, Doa, Al-Quran, Kiblat
2. **QuickMenu** (8 ikon biasa): Tasbih, Tracker, Peta, Kalkulator, Checklist, Kurs, Jurnal, Offline

Total **12 ikon** di dua grid berbeda. User harus scroll melewati PromoBanner dan DailyDoaCard untuk sampai ke QuickMenu. Hierarki tidak jelas — kenapa ada 2 grid?

### Home Section Order Tidak Optimal
Urutan sekarang (10+ section vertikal):
```text
PrayerTime → Ramadan Banner → Countdown → UmrahQuickCard → Quick Access (4) → PromoBanner → DailyDoaCard → QuickMenu (8) → FeaturedPackages → Timeline
```
- PromoBanner dan DailyDoaCard **memecah** dua grid menu
- FeaturedPackages (konversi bisnis) terlalu jauh di bawah
- UmrahQuickCard terpisah dari Quick Access, padahal konteksnya sama

### AppHeader Terlalu Banyak Tombol
4 tombol di header: Search, Ramadan, Language, SOS. Pada layar kecil terasa sesak.

---

## Rencana Perbaikan

### 1. Gabungkan Quick Access + QuickMenu → Satu Grid Unified
Gabungkan 12 ikon menjadi **satu grid 4x3** (12 ikon) dengan prioritas visual:
```text
Row 1 (highlight): Manasik  | Doa      | Al-Quran | Kiblat
Row 2:             Tasbih   | Tracker  | Peta     | Kalkulator
Row 3:             Checklist| Kurs     | Jurnal   | Shop
```
- Row 1 tetap pakai gradient besar (spiritual core)
- Row 2-3 pakai style card biasa
- Hapus item "Offline" dari grid (pindah ke Akun > Pengaturan)
- Tambah "Shop" sebagai shortcut (menggantikan Offline)
- Section title: "Menu" saja, tidak perlu dua label

### 2. Reorder Home Sections — Konten Bisnis Naik
```text
PrayerTime → [Ramadan Banner] → [Countdown] → Unified Menu Grid → DailyDoaCard (compact) → PromoBanner → FeaturedPackages → UmrahQuickCard → [Timeline]
```
- Menu grid langsung setelah prayer = user bisa akses fitur tanpa scroll
- PromoBanner + FeaturedPackages berurutan = zona konversi bisnis
- UmrahQuickCard turun (progress belajar, bukan prioritas utama)
- DailyDoaCard compact sudah bagus, letakkan sebelum promo

### 3. Pindahkan "Offline Manager" ke Akun
- Hapus dari QuickMenu grid
- Tambah di AkunView section "Pengaturan Aplikasi" (sebelum Language)
- Fitur offline jarang diakses, tidak perlu di home

### 4. AppHeader — Pindahkan Language ke Akun
- Hapus language toggle dari header (sudah ada di Akun > Pengaturan)
- Header jadi: Logo | Search | Ramadan | SOS — lebih bersih

### 5. AkunView — Tambah Shortcut "Offline" + Hapus Language dari Header
- Tambah tombol "Mode Offline" di section Pengaturan
- Tidak ada duplikat lagi

---

## Implementasi Teknis

| File | Perubahan |
|------|-----------|
| `src/components/home/HomeView.tsx` | Hapus Quick Access grid terpisah; reorder sections; gabung ke UnifiedMenu |
| `src/components/home/QuickMenu.tsx` | Gabungkan 4 ikon Quick Access + 8 ikon QuickMenu jadi satu grid 4x3; baris pertama pakai gradient style; ganti "Offline" dengan "Shop" |
| `src/components/layout/AppHeader.tsx` | Hapus language toggle dropdown |
| `src/components/akun/AkunView.tsx` | Tambah tombol "Mode Offline" di section Pengaturan |

### Detail QuickMenu Unified:
```typescript
const menuItems = [
  // Row 1 - Spiritual core (gradient style)
  { id: 'manasik', label: 'Manasik', icon: BookOpen, gradient: 'from-purple-500 to-purple-600', isCore: true },
  { id: 'doaharian', label: 'Doa', icon: HandHeart, gradient: 'from-orange-500 to-orange-600', isCore: true },
  { id: 'quran', label: 'Al-Quran', icon: Book, gradient: 'from-emerald-500 to-emerald-600', isCore: true },
  { id: 'qibla', label: 'Kiblat', icon: Compass, gradient: 'from-sky-500 to-sky-600', isCore: true },
  // Row 2-3 - Utilitas
  { id: 'tasbih', label: 'Tasbih', icon: Fingerprint },
  { id: 'ibadah', label: 'Tracker', icon: Flame, isHighlight: true },
  { id: 'peta', label: 'Peta', icon: Map },
  { id: 'tabungan', label: 'Kalkulator', icon: Wallet },
  { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
  { id: 'kurs', label: 'Kurs', icon: DollarSign },
  { id: 'journal', label: 'Jurnal', icon: BookHeart },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
];
```

### Urutan Implementasi:
1. Gabung QuickMenu (utama — hapus duplikasi grid)
2. Reorder HomeView sections
3. Simplify AppHeader
4. Update AkunView (offline shortcut)

