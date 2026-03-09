

# Rencana Fitur: Edukasi Umroh, Bisnis, & Perbaikan Shop

---

## A. ANALISIS GAP SAAT INI

### Edukasi Umroh -- Yang Kurang
1. **Tidak ada Daily Doa/Hadits** -- jamaah hanya belajar saat buka manasik, tidak ada konten harian yang "menarik balik"
2. **Quiz/Ujian Manasik** -- tidak ada cara mengukur pemahaman jamaah sebelum berangkat
3. **Doa Looping Audio** -- jamaah perlu menghafal doa tawaf/sai, belum ada mode loop audio
4. **Countdown to Departure** -- sudah ada component tapi belum terintegrasi di Learning Hub

### Bisnis Umroh -- Yang Kurang
1. **Testimoni/Review belum prominent** -- review travel ada tapi tidak muncul di halaman paket
2. **Simulasi Cicilan** -- kalkulator ada tapi terpisah, tidak terhubung ke paket tertentu
3. **Referral System** -- tidak ada insentif jamaah mengajak teman

### Shop (Jamaah Side) -- Yang Kurang
1. **Tidak ada "Produk Terkait"** -- saat lihat produk, tidak ada rekomendasi
2. **Tidak ada rating/sold count di card** -- ProductCard hanya tampil harga, tidak ada trust signal
3. **Tidak ada Flash Sale / Promo banner** -- tidak ada urgency driver
4. **Tidak ada "Beli Lagi" shortcut** -- repeat purchase susah
5. **Tidak ada estimasi ongkir** -- hanya flat rate tersembunyi, jamaah tidak tahu biaya kirim sebelum checkout
6. **Tidak ada kategori "Perlengkapan Umroh" yang terintegrasi checklist** -- roadmap sudah tulis tapi belum diimplementasi

### Shop (Seller Side) -- Yang Kurang
1. **Tidak ada promo/voucher tools**
2. **Tidak ada bulk product upload**
3. **Tidak ada payout tracking**

---

## B. FITUR YANG AKAN DIIMPLEMENTASI (Prioritas Tinggi)

### 1. Daily Doa Card (Edukasi Harian)
- Komponen `DailyDoaCard` di HomeView -- tampilkan 1 doa/hadits random per hari
- Data dari tabel `prayers` yang sudah ada
- Rotate daily berdasarkan `dayOfYear % total`
- Bisa di-swipe untuk lihat doa berikutnya
- **Efek bisnis**: User buka app setiap hari (retention)

### 2. Manasik Quiz Mini
- Komponen `ManasikQuiz` di UmrahLearningHub
- 5 soal pilihan ganda per sesi, dari data manasik_guides
- Hardcoded question bank (10-15 soal) berdasarkan materi manasik
- Skor disimpan localStorage, tampilkan badge "Siap Umroh" jika lulus
- **Efek bisnis**: Engagement + confidence building

### 3. Related Products di ProductDetailModal
- Saat buka detail produk, tampilkan 4 produk dari kategori sama (exclude current)
- Query `shop_products` where `category_id = current.category_id AND id != current.id LIMIT 4`
- Horizontal scroll cards kecil di bawah reviews

### 4. Rating & Sold Count di ProductCard
- Tambah `avg_rating` dan `sold_count` field di tampilan
- Query dari `product_reviews` (sudah ada hook `useProductReviews`)
- Tampilkan star rating + "terjual X" di bawah harga

### 5. Estimasi Ongkir di Product Detail
- Tampilkan flat shipping cost dari seller profile di ProductDetailModal
- Info "Ongkir mulai dari Rp X" sebelum add to cart
- Data sudah tersedia di `seller_profiles.shipping_cost`

### 6. Checklist-to-Shop Integration
- Di UmrahLearningHub checklist, tambahkan link "Beli" di samping item yang relevan
- Klik "Beli" → navigate ke ShopView dengan search pre-filled (contoh: "kain ihram")
- **Efek bisnis**: Konversi langsung dari edukasi ke pembelian

---

## C. IMPLEMENTASI TEKNIS

### File yang diubah:
| File | Perubahan |
|------|-----------|
| `src/components/home/HomeView.tsx` | Tambah DailyDoaCard |
| `src/components/home/DailyDoaCard.tsx` | **Baru** -- Card doa harian |
| `src/components/learning/ManasikQuiz.tsx` | **Baru** -- Quiz manasik |
| `src/components/learning/UmrahLearningHub.tsx` | Tambah tab Quiz, link "Beli" di checklist |
| `src/components/shop/ProductDetailModal.tsx` | Tambah Related Products + estimasi ongkir |
| `src/components/shop/ProductCard.tsx` | Tambah rating star + sold count |
| `src/hooks/useShopProducts.ts` | Tambah hook `useRelatedProducts` |
| `src/pages/Index.tsx` | Handle navigasi checklist→shop dengan search param |

### Tidak perlu migrasi database -- semua data sudah ada di tabel existing (`prayers`, `manasik_guides`, `shop_products`, `product_reviews`, `seller_profiles`).

### Flow Checklist → Shop:
```text
UmrahLearningHub (Checklist)
  └─ Item "Kain ihram" → [Beli] button
       └─ openView('shop', { search: 'kain ihram' })
            └─ ShopView pre-fills search input
```

### DailyDoaCard Logic:
```text
dayOfYear = Math.floor((now - jan1) / 86400000)
doaIndex = dayOfYear % prayers.length
→ Tampilkan prayers[doaIndex] dengan arabic + latin + meaning
```

---

## D. URUTAN IMPLEMENTASI
1. DailyDoaCard (engagement harian)
2. Checklist-to-Shop links (konversi)
3. ProductCard rating + Related Products (trust & discovery)
4. Estimasi Ongkir (reduce checkout friction)
5. ManasikQuiz (engagement & confidence)

