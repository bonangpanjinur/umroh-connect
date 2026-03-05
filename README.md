# Umroh Connect

Marketplace & Pendamping Ibadah Umroh terpercaya.

## Teknologi yang Digunakan

Proyek ini dibangun dengan:

- **Vite** - Build tool frontend yang cepat
- **React** - Library UI untuk membangun antarmuka pengguna
- **TypeScript** - Superset JavaScript dengan pengetikan statis
- **Supabase** - Backend-as-a-Service untuk database dan autentikasi
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Komponen UI yang dapat digunakan kembali

## Cara Menjalankan Secara Lokal

Ikuti langkah-langkah berikut:

```sh
# 1. Clone repository
git clone https://github.com/bonangpanjinur/umroh-connect.git

# 2. Masuk ke direktori proyek
cd umroh-connect

# 3. Instal dependensi
npm install

# 4. Buat file .env dan tambahkan kredensial Supabase Anda
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 5. Jalankan server pengembangan
npm run dev
```

## Deployment ke Vercel

Proyek ini siap untuk di-deploy ke Vercel dengan koneksi langsung ke Supabase:

1. Hubungkan repository GitHub ini ke Vercel.
2. Tambahkan Environment Variables berikut di Vercel:
   - `VITE_SUPABASE_URL`: URL proyek Supabase Anda.
   - `VITE_SUPABASE_ANON_KEY`: Anon Key proyek Supabase Anda.
3. Vercel akan secara otomatis mendeteksi konfigurasi Vite dan melakukan build.

## Kontribusi

Silakan buka Issue atau Pull Request untuk berkontribusi pada proyek ini.
