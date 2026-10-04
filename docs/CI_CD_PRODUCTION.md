# CI/CD Production

## Alur otomatis

Push ke `main` pada source frontend, Edge Functions, migration, atau konfigurasi build otomatis memicu `.github/workflows/deploy-production.yml` setelah verifikasi berikut lulus:

- integration contract smoke test;
- TypeScript typecheck;
- production frontend build.

Setelah itu workflow akan:

1. menjalankan `supabase db push`;
2. deploy `catalog-ingest`, `lead-routing`, dan `lead-admin`;
3. deploy frontend ke Vercel.

Workflow memakai GitHub Environment `production`. Gunakan required reviewers pada environment tersebut bila production perlu approval sebelum secret dapat dipakai.

## Secrets GitHub Environment: `production`

| Secret | Kegunaan |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Token Supabase CLI untuk migration dan Edge Functions |
| `SUPABASE_PROJECT_REF` | Project reference Supabase pusat |
| `VERCEL_TOKEN` | Token deployment Vercel |
| `VERCEL_ORG_ID` | Organization/team ID Vercel |
| `VERCEL_PROJECT_ID` | Project ID frontend `umroh-connect` |

Frontend build juga membutuhkan environment variables non-secret yang sesuai, misalnya `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_CORE_API_URL`. Set variable tersebut pada Vercel atau tambahkan pada workflow jika build perlu dilakukan di GitHub Actions.

## Manual dispatch

Workflow tetap dapat dijalankan melalui **Actions → Deploy Production → Run workflow**. Input `ref` digunakan untuk deploy commit/tag yang sudah lulus CI.

## Catatan migration

Migration dijalankan sebelum Edge Function deployment. Migration harus backward-compatible dengan function yang sedang production. Jangan menyimpan token Supabase, service role key, atau credential integrasi pada repository.

## Rollback

- Vercel: promote deployment frontend sebelumnya.
- Supabase Edge Functions: deploy ulang source commit sebelumnya.
- Database: gunakan forward-fix migration; jangan menghapus migration yang telah diterapkan.
