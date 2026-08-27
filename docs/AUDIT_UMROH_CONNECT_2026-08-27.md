# Audit Menyeluruh Repository `umroh-connect`

**Tanggal audit:** 27 Agustus 2026  
**Repository:** `bonangpanjinur/umroh-connect`  
**Commit audit:** `0e3a594`  
**Peran produk:** Marketplace publik `arahumroh.id`

## Kesimpulan eksekutif

Repository frontend marketplace sudah dapat menghasilkan bundle production melalui Vite, tetapi belum siap production. Build berhasil, namun lint memiliki 447 masalah, unit test gagal pada dua test karena komponen dirender tanpa provider auth, dependency lockfile npm tidak sinkron, dan masih terdapat direct Supabase access pada 71 file serta 215 baris hasil scan. Selain itu, frontend masih menggunakan `VITE_OPENAI_API_KEY` dengan `dangerouslyAllowBrowser: true`, yang merupakan risiko kebocoran secret.

Repository sudah memiliki `src/lib/coreApi.ts`, tetapi helper tersebut masih mengambil session dari Supabase. Dengan demikian migrasi ke Core API belum sepenuhnya memutus dependency auth legacy.

## Bukti verifikasi

| Pemeriksaan | Hasil | Status |
|---|---:|---|
| Vite production build | Berhasil | Pass dengan warning chunk besar dan stale Browserslist |
| TypeScript | Belum dapat dijadikan gate final | Perintah project melalui pnpm dipengaruhi lifecycle install; perlu ulang di CI bersih |
| ESLint | 447 masalah: 409 error, 38 warning | Fail |
| Vitest | 1 file gagal, 2 test gagal, 1 file lulus | Fail |
| npm clean install | Gagal | `package-lock.json` tidak sinkron dengan `package.json` |
| pnpm install | Dependency terpasang, tetapi lifecycle berhenti pada ignored build scripts | Perlu CI policy yang eksplisit |
| Direct Supabase scan | 71 file, 215 baris | Belum selesai |
| Vercel config | Rewrite SPA tersedia | Perlu verifikasi deployment/domain/CORS |

## Temuan Prioritas A — wajib sebelum public launch

### A1. Secret OpenAI terekspos ke browser

File `src/services/aiService.ts` membuat client OpenAI dengan `import.meta.env.VITE_OPENAI_API_KEY` dan `dangerouslyAllowBrowser: true`. Variable `VITE_` akan dibundle ke browser, sehingga key dapat diekstrak oleh siapa pun yang membuka marketplace.

**Dampak:** penggunaan API tanpa izin, biaya tidak terkendali, prompt abuse, dan potensi kebocoran data konteks.

**Perbaikan:** hapus client OpenAI dari frontend. Panggil endpoint Core API yang memiliki rate limit, auth/capability, audit, dan server-side secret. Jika endpoint AI copywriting belum tersedia, sementara fitur harus disabled dengan pesan yang jelas, bukan memakai secret browser.

### A2. Auth Core API masih bergantung pada Supabase

`src/lib/coreApi.ts` mengimpor client Supabase dan memanggil `supabase.auth.getSession()`. Hal ini bertentangan dengan target Core session/auth contract dan membuat marketplace masih tergantung pada auth legacy.

**Perbaikan:** buat `coreSession` adapter berbasis session/token Core. Core API client harus membaca token dari adapter tersebut, bukan dari Supabase client. Integrasi lama hanya boleh berada di compatibility boundary sementara.

### A3. Direct Supabase mutation/read masih aktif

Static scan menemukan direct Supabase pada 71 file dan 215 baris. Temuan prioritas tinggi perlu dikelompokkan menjadi cart, content, notification, chat/realtime, storage, admin, customer, booking, dan payment.

**Perbaikan:** setiap domain yang sudah memiliki endpoint Core wajib menghapus import client Supabase dari UI/hook terkait. Mutation harus melalui Core API dengan ownership, idempotency, dan audit.

### A4. Unit test gagal karena test harness tidak menyediakan AuthProvider

`PackageQuotaDetail.test.tsx` gagal karena `ItineraryEditor` menggunakan `useAuthContext()` tanpa `AuthProvider`. Error terjadi pada test render tree, bukan pada assertion business utama.

**Perbaikan:** mock `ItineraryEditor` pada test yang hanya menguji restore quota, atau render dengan provider lengkap. Pilihan yang lebih tepat adalah mock child component yang tidak relevan agar test tetap fokus pada restore command.

### A5. Lint production gate gagal

ESLint menemukan 409 error dan 38 warning. Banyak error berasal dari `no-explicit-any`, termasuk pada Supabase function dan component legacy. Lint belum boleh dijadikan blocking global sebelum legacy scope dipisahkan, tetapi file yang diubah harus bebas error.

**Perbaikan:** aktifkan lint gate untuk file yang dimigrasikan, kemudian bersihkan domain per batch. Jangan mematikan rule secara global.

## Temuan Prioritas B — penting untuk integrasi marketplace

| Area | Temuan | Perbaikan |
|---|---|---|
| Cart | Cart mutation legacy masih mungkin memakai Supabase | Gunakan Commerce cart API, idempotency, user ownership |
| Orders | Order history perlu dipastikan seluruh mutation/status memakai Core | Tambahkan contract test dan tenant/seller ownership |
| Payment | Frontend payment flow perlu memastikan redirect/return refetch status | Core payment intent + webhook sebagai source of truth |
| Storage | Upload avatar/content/document masih memiliki pola legacy | Presigned URL/private asset resolver Core |
| Realtime | Chat/order/tracking sebagian masih channel legacy | Core projection + SSE/Streams yang ownership-safe |
| Search | Marketplace search perlu API contract stabil | Core aggregator dengan public-field allowlist |
| Admin | Admin pages pada marketplace masih dapat menyentuh tabel legacy | Pisahkan admin marketplace dari Super Admin platform |
| Cache | Query key tenant/branch/user perlu konsisten | Sertakan scope dan clear cache ketika session berubah |
| Error handling | Beberapa hook bergantung pada shape response lama | Standardisasi `CoreApiError`, request ID, retry policy |
| Vercel | `vercel.json` hanya mengatur SPA rewrite | Tambahkan environment separation, headers, CSP, preview policy |

## Temuan Prioritas C — penyempurnaan

- Bundle utama sekitar 3.9 MB sebelum gzip; perlu code splitting untuk dashboard/admin dan library seperti XLSX/PDF.
- Browserslist data sudah stale.
- `npm ci` tidak reproducible karena `package-lock.json` tidak sinkron. Pilih pnpm sebagai package manager resmi atau regenerate npm lockfile.
- PWA/service worker perlu diuji terhadap cache invalidation dan deployment rollback.
- Error boundary, empty state, loading state, dan offline behavior perlu diuji pada halaman marketplace utama.
- Playwright perlu ditambah untuk login, search, detail package, checkout, order history, payment return, seller order, chat, dan tenant/session switch.
- CORS dan CSP harus diuji setelah `api.arahumroh.id` aktif.
- Public projection harus memastikan email, phone, internal notes, raw storage key, dan private document URL tidak ikut terkirim.

## Roadmap implementasi

### Prioritas A

1. Hilangkan OpenAI secret dari browser.
2. Selesaikan Core session adapter pada `coreApi.ts`.
3. Perbaiki test `PackageQuotaDetail` dan pastikan Vitest lulus.
4. Migrasikan residual cart mutation yang paling berisiko.
5. Jalankan typecheck, build, dan targeted lint.
6. Commit dengan acceptance evidence.

### Prioritas B

1. Migrasikan content/media/storage yang masih direct.
2. Migrasikan chat/order/tracking realtime legacy.
3. Tambahkan contract test marketplace terhadap Core API.
4. Tambahkan E2E checkout/payment return/order ownership.
5. Perbaiki query key dan session-context invalidation.
6. Commit terpisah per domain.

### Prioritas C

1. Code splitting dan bundle optimization.
2. PWA cache strategy dan rollback test.
3. CSP/security headers Vercel.
4. Accessibility, responsive, empty/error states.
5. Observability frontend dan release telemetry.

## Acceptance criteria marketplace

Marketplace dapat disebut siap staging apabila typecheck, build, lint pada modified scope, unit test, E2E smoke, Core API contract, auth/session, dan tenant/seller ownership test lulus. Marketplace belum boleh disebut production-ready selama API key masih di browser, direct Supabase mutation masih aktif, atau payment/order flow hanya diuji dengan mock.
