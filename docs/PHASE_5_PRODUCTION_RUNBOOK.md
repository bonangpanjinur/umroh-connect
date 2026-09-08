# Fase 5 — Production Runbook

Dokumen ini menjadi prosedur operasional untuk merilis `umroh-connect` dan mengaktifkan integrasi dengan instalasi `sistem-travel-umroh`. Deployment production bersifat **manual dan gated**; CI hanya dapat meluluskan artefak, sedangkan perubahan database dan Edge Function harus dijalankan oleh operator yang memiliki akses production.

## 1. Pre-deployment gate

Pastikan branch `main` telah lulus workflow `CI`, migration telah direview, backup database pusat tersedia, dan environment variables berikut telah terdaftar pada environment production. Jangan menaruh secret pada repository atau `VITE_*`.

| Secret/variable | Pemakaian |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Deploy migration/function pusat |
| `SUPABASE_PROJECT_REF` | Target project pusat |
| `VITE_SUPABASE_URL` | Build frontend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build frontend |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Deploy frontend bila memakai Vercel |
| `UMROH_CONNECT_*` | Konfigurasi server-side instalasi travel |

## 2. Deploy pusat

Jalankan dari checkout commit yang sudah lulus CI:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm test:integration:contract
pnpm typecheck
pnpm build
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx supabase db push
npx supabase functions deploy catalog-ingest --no-verify-jwt
npx supabase functions deploy lead-routing --no-verify-jwt
npx supabase functions deploy lead-admin
```

Frontend dapat dirilis menggunakan provider yang sudah dikonfigurasi, misalnya:

```bash
npx vercel deploy --prod --token "$VERCEL_TOKEN" --scope "$VERCEL_ORG_ID"
```

Gunakan `--no-verify-jwt` hanya untuk function server-to-server yang melakukan verifikasi credential HMAC sendiri. `lead-admin` harus tetap menggunakan autentikasi user platform.

## 3. Deploy setiap instalasi travel

Pada instalasi travel, backup database terlebih dahulu, jalankan migration berurutan, deploy backend, lalu konfigurasi server-side berikut:

```text
TRAVEL_INSTALLATION_ID
UMROH_CONNECT_CATALOG_INGEST_URL
UMROH_CONNECT_LEAD_ROUTING_URL
UMROH_CONNECT_INTEGRATION_KEY
UMROH_CONNECT_INTEGRATION_SECRET
CATALOG_SYNC_BATCH_SIZE
LEAD_INBOX_BATCH_SIZE
```

Aktifkan worker katalog dan lead inbox melalui process manager atau scheduler yang sudah digunakan deployment travel. Worker harus dapat restart tanpa kehilangan pending outbox atau lead delivery.

## 4. Smoke test pascadeploy

Lakukan verifikasi berurutan: buka dashboard admin, pastikan tenant installation connected, submit satu lead test dengan `Idempotency-Key` unik, pastikan lead muncul pada `Lead & Delivery`, jalankan worker lead inbox pada staging atau tenant pilot, verifikasi acknowledgement accepted, lalu kirim event katalog yang tidak sensitif dan pastikan version guard tidak menerima event lama.

Jangan memakai data jamaah nyata pada smoke test. Gunakan tenant staging atau tenant pilot yang telah disepakati.

## 5. Rollback

Jika smoke test gagal, hentikan worker publisher/lead inbox pada installation terdampak, nonaktifkan credential yang bermasalah dari registry, dan kembalikan frontend ke deployment sebelumnya. Jangan menghapus migration production. Untuk perubahan schema, lakukan forward-fix migration yang kompatibel; restore backup hanya melalui prosedur database resmi setelah dampak dan titik pemulihan disetujui.

## 6. Exit criteria

Rilis dinyatakan selesai apabila CI lulus, migration dan function deployment tercatat, dashboard menunjukkan installation connected, tidak ada delivery dead-letter baru selama periode observasi, lead test diterima tepat satu kali di sistem travel, dan kedua working tree/commit production terdokumentasi.
