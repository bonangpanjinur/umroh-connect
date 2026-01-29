# ARAH UMROH - Dokumentasi Lengkap

## 📋 Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Arsitektur Aplikasi](#arsitektur-aplikasi)
3. [Struktur Folder](#struktur-folder)
4. [Alur Aplikasi](#alur-aplikasi)
5. [Fitur-Fitur](#fitur-fitur)
6. [Komponen Utama](#komponen-utama)
7. [Hooks Custom](#hooks-custom)
8. [Edge Functions](#edge-functions)
9. [Database Schema](#database-schema)
10. [Kekurangan & Roadmap](#kekurangan--roadmap)
11. [Panduan Deployment](#panduan-deployment)

---

## Gambaran Umum

**Arah Umroh** adalah marketplace digital untuk paket Umroh dan Haji yang menghubungkan calon jamaah dengan travel agent terverifikasi. Aplikasi ini dibangun dengan teknologi modern dan fokus pada pengalaman pengguna yang optimal.

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **PWA**: vite-plugin-pwa

### Target Pengguna
1. **Jamaah** - Calon jamaah Umroh/Haji yang mencari paket
2. **Agent** - Travel agent yang menawarkan paket
3. **Admin** - Super admin platform

---

## Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Pages          │  Components        │  Hooks               │
│  - Index        │  - Home            │  - useAuth           │
│  - Auth         │  - Paket           │  - usePackages       │
│  - Agent        │  - Panduan         │  - useBookings       │
│  - Admin        │  - Checklist       │  - useChat           │
│                 │  - Maps            │  - useGeolocation    │
├─────────────────────────────────────────────────────────────┤
│                    CONTEXTS                                  │
│  - AuthContext  │ ThemeContext │ LanguageContext │ ElderlyMode│
├─────────────────────────────────────────────────────────────┤
│                    SUPABASE                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │ Database │  │ Storage  │  │  Edge    │    │
│  │          │  │(Postgres)│  │ (Files)  │  │Functions │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Struktur Folder

```
src/
├── components/           # Komponen React
│   ├── admin/           # Komponen Admin Dashboard
│   ├── agent/           # Komponen Agent Dashboard
│   ├── akun/            # Profil & Settings
│   ├── booking/         # Booking & Payment
│   ├── chat/            # Real-time Chat
│   ├── checklist/       # Persiapan Checklist
│   ├── countdown/       # Hitung Mundur Keberangkatan
│   ├── currency/        # Konversi Mata Uang
│   ├── doa/             # Kumpulan Doa
│   ├── feedback/        # Bug Report & Saran
│   ├── haji/            # Fitur Haji
│   ├── home/            # Halaman Utama
│   ├── inquiry/         # Form Inquiry
│   ├── journal/         # Jurnal Perjalanan
│   ├── layout/          # Header & Navigation
│   ├── manasik/         # Panduan Manasik
│   ├── maps/            # Peta Interaktif
│   ├── modals/          # Modal Qibla, SOS, Tasbih
│   ├── notifications/   # Push Notifications
│   ├── offline/         # Offline Manager
│   ├── packing/         # AI Packing List
│   ├── paket/           # List & Detail Paket
│   ├── panduan/         # Tab Panduan
│   ├── pwa/             # PWA Components
│   ├── quran/           # Al-Quran Reader
│   ├── recommendation/  # AI Package Recommendation
│   ├── reminder/        # Reminder Settings
│   ├── reviews/         # Reviews & Ratings
│   ├── settings/        # Language & Theme
│   ├── tracking/        # GPS Tracking & Geofencing
│   └── ui/              # shadcn/ui Components
├── contexts/            # React Contexts
├── data/                # Static Data
├── hooks/               # Custom Hooks
├── integrations/        # Supabase Client
├── lib/                 # Utilities
├── pages/               # Route Pages
├── types/               # TypeScript Types
└── assets/              # Images & Media

supabase/
└── functions/           # Edge Functions
    ├── check-agent-notifications/
    ├── departure-reminders/
    ├── generate-packing-list/
    ├── payment-reminders/
    ├── recommend-packages/
    ├── send-push-notification/
    └── send-whatsapp-reminder/
```

---

## Alur Aplikasi

### 1. Alur Jamaah (User)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Buka    │───▶│  Browse  │───▶│  Detail  │───▶│  Inquiry │
│   App    │    │  Paket   │    │  Paket   │    │   /Chat  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                     ┌────────────────────────────────┘
                     ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │  Booking │───▶│ Pembayaran│───▶│ Persiapan│
              │   Form   │    │ Tracking │    │ Checklist│
              └──────────┘    └──────────┘    └──────────┘
                                                      │
                     ┌────────────────────────────────┘
                     ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Manasik  │───▶│Keberangkat│───▶│  Review  │
              │  Guide   │    │  an      │    │  Travel  │
              └──────────┘    └──────────┘    └──────────┘
```

### 2. Alur Agent

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───▶│ Dashboard│───▶│  Kelola  │
│  Agent   │    │  Agent   │    │  Paket   │
└──────────┘    └──────────┘    └──────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Booking  │   │ Inquiry  │   │Analytics │
│Management│   │Management│   │Dashboard │
└──────────┘   └──────────┘   └──────────┘
```

### 3. Alur Admin

```
┌──────────┐    ┌──────────┐
│  Login   │───▶│ Dashboard│
│  Admin   │    │  Admin   │
└──────────┘    └──────────┘
                     │
     ┌───────┬───────┼───────┬───────┐
     ▼       ▼       ▼       ▼       ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│  User  ││ Travel ││ Konten ││Monetize││Platform│
│ Manage ││ Verify ││ Manage ││  Ads   ││Settings│
└────────┘└────────┘└────────┘└────────┘└────────┘
```

---

## Fitur-Fitur

### 🏠 Fitur Publik (Semua User)

| Fitur | Deskripsi | File Utama |
|-------|-----------|------------|
| Browse Paket | Lihat & filter paket Umroh/Haji | `PaketView.tsx`, `PackageCard.tsx` |
| Detail Paket | Info lengkap, galeri, review | `PackageDetailModal.tsx` |
| AI Recommendation | Rekomendasi paket berdasarkan preferensi | `AIRecommendationWizard.tsx` |
| Panduan Manasik | Step-by-step manasik dengan audio | `ManasikView.tsx` |
| Kumpulan Doa | Library doa dengan terjemahan | `DoaView.tsx` |
| Peta Interaktif | Lokasi penting Makkah & Madinah | `MapsView.tsx` |
| Arah Kiblat | Kompas digital arah kiblat | `QiblaModal.tsx` |
| Digital Tasbih | Counter tasbih dengan haptic | `TasbihModal.tsx` |
| Konversi Mata Uang | IDR ↔ SAR realtime | `CurrencyConverter.tsx` |
| SOS/Tersesat | Share lokasi via WhatsApp | `SOSModal.tsx` |
| Reviews | Lihat testimoni jamaah | `PublicReviewsView.tsx` |

### 🎒 Fitur Jamaah (Login Required)

| Fitur | Deskripsi | File Utama |
|-------|-----------|------------|
| Booking Paket | Multi-step booking form | `BookingForm.tsx` |
| Payment Tracking | Cicilan & upload bukti bayar | `UpcomingPayments.tsx` |
| Chat dengan Travel | Real-time messaging | `ChatView.tsx` |
| Checklist Persiapan | Daftar persiapan dengan progress | `ChecklistView.tsx` |
| AI Packing List | Generate list berdasarkan profil | `PackingListGenerator.tsx` |
| Jurnal Perjalanan | Dokumentasi dengan foto & mood | `JournalView.tsx` |
| Countdown | Hitung mundur keberangkatan | `DepartureCountdown.tsx` |
| Group Tracking | Lacak anggota grup realtime | `GroupTrackingView.tsx` |
| Notifikasi Push | Reminder pembayaran & departure | `PushNotificationSettings.tsx` |

### 👔 Fitur Agent

| Fitur | Deskripsi | File Utama |
|-------|-----------|------------|
| Kelola Paket | CRUD paket & keberangkatan | `PackageForm.tsx`, `DepartureForm.tsx` |
| Kelola Booking | Konfirmasi & tracking | `BookingsManagement.tsx` |
| Kelola Inquiry | Lead management | `InquiriesManagement.tsx` |
| Analytics | Statistik & grafik performa | `AnalyticsDashboard.tsx` |
| Haji Management | Registrasi haji khusus | `HajiManagement.tsx` |
| Chat Management | Balas chat jamaah | `ChatManagement.tsx` |
| Featured Package | Promosi paket unggulan | `FeaturedPackageManager.tsx` |
| Notifikasi Agent | Realtime business alerts | `AgentNotificationCenter.tsx` |

### 🛡️ Fitur Admin

| Fitur | Deskripsi | File Utama |
|-------|-----------|------------|
| User Management | Kelola user & suspend | `UsersManagement.tsx` |
| Travel Verification | Approve/reject travel | `TravelsManagement.tsx` |
| Manasik Management | CRUD panduan manasik | `ManasikManagement.tsx` |
| Locations Management | Kelola lokasi penting | `LocationsManagement.tsx` |
| Prayers Management | CRUD doa-doa | `PrayersManagement.tsx` |
| Packing Templates | Template packing list | `PackingTemplatesManagement.tsx` |
| Membership Management | Kelola langganan agent | `MembershipsManagement.tsx` |
| Credits Management | Sistem kredit promosi | `CreditsManagement.tsx` |
| Banner Management | Promosi banner | `BannersManagement.tsx` |
| Featured Management | Kelola paket unggulan | `FeaturedManagement.tsx` |
| Platform Settings | Konfigurasi platform | `PlatformSettings.tsx` |
| Analytics Global | Statistik platform | `AdminAnalyticsDashboard.tsx` |
| Feedback Management | Review bug reports | `FeedbackManagement.tsx` |
| Reviews Moderation | Moderasi review | `ReviewsManagement.tsx` |

### ♿ Fitur Aksesibilitas

| Fitur | Deskripsi |
|-------|-----------|
| Mode Lansia | Font besar 125%, touch target 48px |
| Multi-Bahasa | Indonesia, English, Arabic (RTL) |
| Dark Mode | Tema gelap untuk kenyamanan mata |
| Offline Support | Peta & konten offline |
| PWA | Install ke home screen |

---

## Komponen Utama

### Pages

| File | Deskripsi |
|------|-----------|
| `Index.tsx` | Main app dengan bottom navigation tabs |
| `Auth.tsx` | Login & Register page |
| `AgentDashboard.tsx` | Dashboard khusus agent |
| `AdminDashboard.tsx` | Dashboard super admin |
| `NotFound.tsx` | 404 page |

### Contexts

| File | Deskripsi |
|------|-----------|
| `AuthContext.tsx` | State user & session |
| `ThemeContext.tsx` | Light/Dark mode |
| `LanguageContext.tsx` | i18n (ID/EN/AR) |
| `ElderlyModeContext.tsx` | Mode lansia settings |

---

## Hooks Custom

### Authentication & User

| Hook | Deskripsi |
|------|-----------|
| `useAuth` | Login, logout, session |
| `useJamaahAccess` | Cek akses fitur premium |

### Data Fetching

| Hook | Deskripsi |
|------|-----------|
| `usePackages` | Fetch & filter paket |
| `useBookings` | Manage booking user |
| `useReviews` | CRUD reviews |
| `useChat` | Real-time chat |
| `useMasterData` | Hotels & Airlines |
| `useManasikGuides` | Panduan manasik |
| `usePrayers` | Doa-doa |
| `useImportantLocations` | Lokasi penting |

### Features

| Hook | Deskripsi |
|------|-----------|
| `usePrayerTimes` | Jadwal sholat (Aladhan API) |
| `useGeolocation` | GPS user |
| `useWeather` | Cuaca Makkah/Madinah |
| `useGroupTracking` | Realtime group locations |
| `useGeofencing` | Geofence alerts |
| `useOfflineManager` | IndexedDB map tiles |

### Notifications

| Hook | Deskripsi |
|------|-----------|
| `usePushNotifications` | Web push setup |
| `useAdzanNotifications` | Reminder adzan |
| `useDepartureNotifications` | Reminder departure |
| `useChecklistNotifications` | Reminder checklist |

### Admin/Agent

| Hook | Deskripsi |
|------|-----------|
| `useAdminData` | Admin dashboard data |
| `useAdminAnalytics` | Platform analytics |
| `useAgentData` | Agent dashboard data |
| `useAgentNotifications` | Agent alerts |

---

## Edge Functions

| Function | Trigger | Deskripsi |
|----------|---------|-----------|
| `check-agent-notifications` | Cron (hourly) | Cek & create agent alerts |
| `departure-reminders` | Cron (daily 08:00) | Kirim reminder H-30/14/7/3/1 |
| `payment-reminders` | Cron (daily 09:00) | Kirim reminder cicilan |
| `generate-packing-list` | API Call | AI generate packing list |
| `recommend-packages` | API Call | AI package recommendations |
| `send-push-notification` | API Call | Send web push |
| `send-whatsapp-reminder` | API Call | Generate WA link |

---

## Database Schema

Lihat file `docs/DATABASE_SCHEMA.sql` untuk SQL lengkap.

### Core Tables
- `profiles` - Data user
- `user_roles` - Role-based access
- `travels` - Travel agencies
- `packages` - Paket Umroh/Haji
- `departures` - Jadwal keberangkatan

### Booking & Payment
- `bookings` - Reservasi
- `payment_schedules` - Jadwal cicilan

### Communication
- `chat_messages` - Pesan chat
- `package_inquiries` - Lead inquiries
- `agent_notifications` - Alert agent

### Content
- `manasik_guides` - Panduan manasik
- `important_locations` - Lokasi penting
- `prayers` - Koleksi doa
- `packing_templates` - Template packing

### User Features
- `checklists` - Master checklist
- `user_checklists` - Progress user
- `journals` - Jurnal perjalanan
- `journal_photos` - Foto jurnal

### Tracking
- `tracking_groups` - Grup tracking
- `group_locations` - Posisi realtime
- `geofences` - Safe zones
- `geofence_alerts` - Alert keluar zone

### Monetization
- `memberships` - Langganan agent
- `package_credits` - Kredit promosi
- `featured_packages` - Paket unggulan
- `banners` - Banner iklan

---

## Kekurangan & Roadmap

### 🔴 Kekurangan Saat Ini

1. **Backend Integration**
   - Tidak ada email transaksional (butuh SMTP/SendGrid)
   - WhatsApp hanya redirect, bukan API
   - Push notification perlu VAPID keys

2. **Payment**
   - Tidak ada payment gateway (manual transfer)
   - Tidak ada auto-reconciliation

3. **Analytics**
   - Tidak ada integrasi Google Analytics
   - Tidak ada A/B testing

4. **Performance**
   - Belum ada image optimization (CDN)
   - Belum ada lazy loading untuk lists

5. **Testing**
   - Unit test minimal
   - Tidak ada E2E tests

6. **SEO**
   - Butuh SSR untuk SEO optimal
   - Tidak ada sitemap generator

### 🟡 Perbaikan Segera

1. Fix environment variable naming consistency
2. Implement proper error boundaries
3. Add loading skeletons untuk semua fetch
4. Optimize bundle size (code splitting)

### 🟢 Roadmap Masa Depan

#### Phase 1 - Core Improvements
- [ ] Payment gateway (Midtrans/Xendit)
- [ ] Email service (SendGrid/Resend)
- [ ] WhatsApp Business API
- [ ] Image CDN (Cloudinary/imgix)

#### Phase 2 - Features
- [ ] Video call untuk konsultasi
- [ ] E-Visa assistance
- [ ] Travel insurance integration
- [ ] Multi-currency pricing

#### Phase 3 - Scale
- [ ] Native mobile apps (React Native)
- [ ] Multi-tenant architecture
- [ ] API monetization
- [ ] Affiliate program

---

## Panduan Deployment

### Environment Variables (Vercel)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx
VITE_SUPABASE_PROJECT_ID=xxx
```

### Deployment Steps

1. **Setup Supabase**
   ```bash
   # Run DATABASE_SCHEMA.sql di SQL Editor Supabase
   ```

2. **Configure Auth**
   - Enable Email auth
   - Disable "Confirm email" untuk testing
   - Set Site URL ke production domain

3. **Storage Buckets**
   - Buat buckets sesuai schema
   - Set policies

4. **Deploy Edge Functions**
   ```bash
   supabase functions deploy --project-ref xxx
   ```

5. **Vercel Deploy**
   - Connect repo
   - Add env variables
   - Deploy

### Post-Deployment Checklist

- [ ] Test login/register
- [ ] Test CRUD operations
- [ ] Check RLS policies
- [ ] Verify storage upload
- [ ] Test PWA install
- [ ] Verify push notifications

---

## Kontak & Support

Untuk pertanyaan pengembangan, hubungi tim developer melalui:
- GitHub Issues
- Email: [developer@arahmurah.com]

---

*Dokumentasi terakhir diupdate: 29 Januari 2025*
