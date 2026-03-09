

# Analisis Bisnis, UX, Admin Login Flow & Perbaikan Tracker

---

## A. ANALISIS BISNIS PER ROLE

### Jamaah/Buyer (Revenue Driver)
- **Booking umroh** sudah ada, tapi flow terlalu panjang (4 klik) tanpa progress indicator
- **Shop** lengkap (cart, checkout, wishlist, order history) -- monetisasi jalan
- **Premium subscription** sudah ada, tapi CTA terlalu tersembunyi
- **Missing**: Tidak ada loyalty/reward system, tidak ada referral -- missed opportunity

### Agent (B2B Revenue)
- **Membership & credits** sudah ada -- core monetisasi
- **Website builder** sudah ada (slug, template, visual builder)
- **Featured package** berbayar sudah ada
- **Missing**: Tidak ada laporan keuangan/commission tracking

### Seller (Marketplace Fee)
- **Full e-commerce flow**: produk, order, chat, review
- **Missing**: Tidak ada payout/disbursement system, tidak ada promo tools

### Admin (Platform Ops)
- **Dashboard lengkap**: 25+ sub-menu grouped sidebar
- **BUG KRITIS**: Admin harus navigasi ke tab Akun dulu untuk menemukan tombol "Admin Dashboard" -- tidak ada shortcut setelah login

---

## B. BUG YANG DITEMUKAN

| # | Bug | Lokasi |
|---|-----|--------|
| 1 | **Admin login flow buruk**: Setelah login, admin diarahkan ke Home biasa. Harus klik tab Akun → scroll → klik "Admin Dashboard". Tidak intuitif. | `Auth.tsx:32-34` |
| 2 | **`profile-updated` event handler stale closure**: `handleProfileUpdate` captures `user` dari initial render (null). Saat event fired, `user` masih null sehingga re-fetch tidak terjadi. | `useAuth.ts:39-44` |
| 3 | **Tracker tab "Ibadah" sub-tab "Hari Ini" tidak ada Achievement/Badges** -- component `AchievementBadges` exist tapi tidak dipakai di IbadahHubView | Unused component |
| 4 | **Mood Check-In tidak muncul di IbadahHubView** -- `MoodCheckIn` component exist tapi tidak di-render di main tracker view, hanya di `TodayHabitsList` | `IbadahHubView.tsx` |

---

## C. TRACKER -- FITUR YANG KURANG & AKAN DITAMBAH

Saat ini Tracker punya: Ibadah (Hari Ini, Tadarus, Dzikir), Kesehatan (Olahraga, Diet), Sedekah, dan Ramadhan mode.

### Fitur baru yang akan ditambah:

1. **Water Intake Tracker** -- Tracking minum air 8 gelas/hari dengan visual glass icons, ada di default habits tapi belum ada dedicated UI
2. **Sleep Tracker** -- Input jam tidur & bangun, hitung durasi, tampilkan trend mingguan
3. **Achievement Badges di Tracker** -- Component sudah ada (`AchievementBadges.tsx`) tapi belum ditampilkan
4. **Mood Check-In prominent** -- Pindahkan ke posisi lebih terlihat di header tracker (saat ini tersembunyi di TodayHabitsList)
5. **Weekly Summary Card** -- Ringkasan mingguan: total habit completed, streak, mood trend

---

## D. RENCANA IMPLEMENTASI

### Task 1: Fix Admin Auto-Redirect Setelah Login
**File**: `Auth.tsx`, `useAuth.ts`
- Setelah login berhasil, cek roles. Jika `isAdmin()`, redirect ke `/admin` bukan `/`
- Jika `isAgent()`, redirect ke `/agent`
- Jika jamaah, redirect ke `/` (default)
- Fix: Di `Auth.tsx`, setelah `signIn` berhasil, tunggu session update lalu cek role dari response

### Task 2: Fix Stale Closure di `profile-updated` Handler
**File**: `useAuth.ts`
- Gunakan `useRef` untuk track current user ID, bukan closure langsung
- `handleProfileUpdate` baca dari ref, bukan dari stale state

### Task 3: Tambah Achievement Badges ke Tracker
**File**: `IbadahHubView.tsx`
- Import dan render `AchievementBadges` di bawah header stats card
- Compact mode, horizontal scroll

### Task 4: Tambah Water Intake Tracker
**File baru**: `src/components/habit/WaterIntakeTracker.tsx`
- 8 glass icons, tap untuk toggle (filled/empty)
- Simpan di localStorage (key: `water_intake_{date}`)
- Tampilkan di tab Kesehatan sebagai sub-section

### Task 5: Tambah Sleep Tracker
**File baru**: `src/components/habit/SleepTracker.tsx`
- Input jam tidur & jam bangun via time picker
- Hitung durasi otomatis
- Weekly bar chart trend
- Simpan di localStorage (key: `sleep_log_{date}`)
- Tampilkan di tab Kesehatan

### Task 6: Weekly Summary Card
**File baru**: `src/components/habit/WeeklySummaryCard.tsx`
- Card ringkasan: total completed, best streak, rata-rata mood, total sedekah
- Render di atas tab content IbadahHubView pada hari Minggu atau selalu visible

### Task 7: Mood Check-In Lebih Prominent
**File**: `IbadahHubView.tsx`
- Jika belum check-in hari ini, tampilkan mini mood prompt di bawah header stats
- Setelah check-in, tampilkan mood badge yang sudah ada

### Urutan Prioritas
1. Task 1 & 2 (bug fix -- admin flow & stale closure)
2. Task 3 & 7 (integrate existing components)
3. Task 4 & 5 (new tracker features)
4. Task 6 (enhancement)

