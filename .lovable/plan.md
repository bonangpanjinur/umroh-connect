

# Rencana Peningkatan UX: Prioritaskan Belajar Umroh

## Masalah Saat Ini

Konten edukasi umroh (Manasik, Doa, Al-Quran, Kiblat) tersembunyi di grid "Menu Utama" yang rata -- setara dengan fitur sekunder seperti Kurs dan Offline. Sementara itu, konten bisnis (Banner Promo, Paket Unggulan) justru mendominasi area atas halaman utama. Ini tidak sesuai dengan misi utama aplikasi sebagai pendamping ibadah umroh.

## Strategi UX Baru

```text
Prioritas tinggi (atas layar)  : Edukasi & Ibadah
Prioritas sedang (tengah)      : Persiapan & Alat bantu
Prioritas rendah (bawah)       : Bisnis & Marketplace
```

## Perubahan 1: Navigasi Bawah (BottomNav)

**Sebelum:**
Beranda | Checklist | Paket | Haji | Akun

**Sesudah:**
Beranda | Belajar | Paket | Shop | Akun

- **Belajar** (ikon BookOpen) -- Hub edukasi baru yang menggabungkan Panduan Manasik, Doa-doa, Al-Quran, dan Peta Lokasi Penting dalam satu halaman terstruktur
- **Shop** (ikon ShoppingBag) -- Menggantikan tab Haji, karena fitur Haji bisa diakses dari dalam menu Belajar atau Akun
- Checklist dipindah ke Quick Menu (tetap bisa diakses, bukan hilang)
- Tab Haji dipindah sebagai sub-section di halaman Belajar

**File:** `src/components/layout/BottomNav.tsx`, `src/types/index.ts`, `src/pages/Index.tsx`

## Perubahan 2: Halaman Belajar Umroh (Baru)

Buat komponen `UmrahLearningHub.tsx` yang menampilkan konten edukasi secara terstruktur:

```text
+------------------------------------------+
|  Belajar Umroh                           |
|  "Panduan lengkap persiapan ibadah"      |
+------------------------------------------+
|  [Tata Cara]  [Doa-doa]  [Al-Quran]     |  <-- Tab navigasi
+------------------------------------------+
|                                          |
|  Tab "Tata Cara":                        |
|  - Kartu progress (X dari Y dipelajari)  |
|  - Daftar langkah manasik               |
|  - Link ke Peta Lokasi Penting          |
|                                          |
|  Tab "Doa-doa":                         |
|  - Kategori doa (Umroh, Harian, dll)    |
|  - Pencarian doa                        |
|                                          |
|  Tab "Al-Quran":                        |
|  - Progress Khatam                      |
|  - Lanjut baca                          |
|                                          |
+------------------------------------------+
|  Section: Persiapan Lainnya             |
|  [Checklist] [Kiblat] [Kalkulator]      |
+------------------------------------------+
```

**File baru:** `src/components/learning/UmrahLearningHub.tsx`

## Perubahan 3: Restrukturisasi HomeView

Urutan konten di halaman Beranda diubah dari:

```text
SEBELUM:                    SESUDAH:
1. Waktu Sholat             1. Waktu Sholat
2. Banner Promo             2. Kartu "Mulai Belajar Umroh" (BARU)
3. Paket Unggulan           3. Quick Menu (reordered)
4. Quick Menu               4. Paket Unggulan
5. Timeline                 5. Banner Promo
                            6. Timeline
```

"Kartu Mulai Belajar Umroh" adalah CTA card bergradien yang menampilkan:
- Progress belajar manasik (misal: "3 dari 7 langkah dipelajari")
- Tombol "Lanjut Belajar" yang mengarah ke tab Belajar
- Tombol cepat: Doa Umroh, Kiblat, Tasbih

**File:** `src/components/home/HomeView.tsx`, `src/components/home/UmrahQuickCard.tsx` (baru)

## Perubahan 4: Reorder Quick Menu

Urutan menu diubah agar fitur edukasi/ibadah di atas:

```text
SEBELUM (4x3 grid):         SESUDAH (4x3 grid):
Tracker  Kalkulator          Manasik   Doa
Kiblat   Tasbih              Al-Quran  Kiblat
Al-Quran Manasik             Tasbih    Tracker
Doa      Peta                Peta      Kalkulator
Kurs     Jurnal              Checklist Kurs
Offline  Oleh-oleh           Jurnal    Offline
```

Manasik, Doa, Al-Quran, dan Kiblat menjadi baris pertama (paling terlihat). Oleh-oleh dihapus dari Quick Menu karena sudah punya tab sendiri di BottomNav.

**File:** `src/components/home/QuickMenu.tsx`

## Perubahan 5: Integrasi Haji & Checklist

- **Haji**: Dipindah ke dalam halaman Belajar sebagai section "Program Haji" di bawah konten Umroh, atau bisa diakses dari menu Akun
- **Checklist**: Dipindah ke Quick Menu dan juga bisa diakses dari halaman Belajar sebagai "Persiapan Saya"

**File:** `src/pages/Index.tsx` (routing update)

## Detail Teknis

| No | File | Perubahan |
|----|------|-----------|
| 1 | `src/types/index.ts` | Update TabId: ganti 'checklist' dan 'haji' dengan 'belajar' dan 'shop' |
| 2 | `src/components/layout/BottomNav.tsx` | Ubah nav items: Beranda, Belajar, Paket, Shop, Akun |
| 3 | `src/components/learning/UmrahLearningHub.tsx` | Komponen baru: hub edukasi dengan tabs Tata Cara, Doa, Al-Quran |
| 4 | `src/components/home/UmrahQuickCard.tsx` | Komponen baru: CTA card "Mulai Belajar Umroh" dengan progress |
| 5 | `src/components/home/HomeView.tsx` | Reorder: UmrahQuickCard setelah PrayerTime, FeaturedPackages turun |
| 6 | `src/components/home/QuickMenu.tsx` | Reorder items: edukasi di atas, bisnis di bawah. Hapus Oleh-oleh |
| 7 | `src/pages/Index.tsx` | Update routing: tab 'belajar' render UmrahLearningHub, tab 'shop' render ShopView |

## Dampak Bisnis

Fitur bisnis TIDAK dihilangkan, hanya digeser prioritasnya:
- **Paket Umroh/Haji** tetap punya tab sendiri di BottomNav
- **Oleh-oleh/Shop** naik status dari Quick Menu menjadi tab BottomNav (lebih mudah diakses)
- **Featured Packages** tetap muncul di Beranda, hanya posisinya di bawah konten edukasi
- **Banner Promo** tetap ada, posisi dipindah ke bawah

Hasil akhir: pengguna yang membuka aplikasi langsung melihat konten edukasi umroh, tapi bisnis tetap hanya 1 tap away.

