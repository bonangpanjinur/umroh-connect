# Rencana Pengembangan: Oleh-Oleh & Perlengkapan

## 📋 Ringkasan
Fitur marketplace khusus untuk oleh-oleh khas Tanah Suci dan perlengkapan umroh/haji, terintegrasi dengan sistem e-commerce yang sudah ada (`shop_*` tables).

---

## 🎯 Fase 1: Katalog Produk Khusus (Sprint 1-2)

### Kategori Oleh-Oleh
- **Makanan**: Kurma (Ajwa, Sukkari, Safawi), Kacang Arab, Coklat, Madu Arab, Air Zamzam
- **Pakaian**: Gamis, Abaya, Sorban, Sajadah Turki, Mukena premium
- **Aksesoris**: Tasbih (kayu, batu), Parfum non-alkohol, Minyak Zaitun, Siwak
- **Souvenir**: Miniatur Ka'bah, Tulisan kaligrafi, Gantungan kunci, Stiker

### Kategori Perlengkapan
- **Pakaian Ihram**: Kain ihram premium, sabuk ihram, sandal ihram
- **Travel Kit**: Tas umroh, koper set, packing cube, travel organizer
- **Ibadah**: Al-Quran travel, buku doa manasik, sajadah lipat, tasbih digital
- **Kesehatan**: P3K travel, obat-obatan dasar, vitamin, masker, hand sanitizer
- **Elektronik**: Powerbank, adaptor Saudi, sim card internasional

### Database
```sql
-- Tambah kategori khusus di shop_categories
INSERT INTO shop_categories (name, slug, icon, is_active) VALUES
('Oleh-Oleh Tanah Suci', 'oleh-oleh', 'gift', true),
('Perlengkapan Umroh', 'perlengkapan-umroh', 'briefcase', true),
('Kurma & Makanan Arab', 'kurma-makanan', 'apple', true),
('Pakaian Ibadah', 'pakaian-ibadah', 'shirt', true);
```

### UI/UX
- Tab khusus "Oleh-Oleh" dan "Perlengkapan" di ShopView
- Filter berdasarkan sub-kategori
- Badge "Asli dari Tanah Suci" untuk produk oleh-oleh
- Badge "Rekomendasi Travel" untuk perlengkapan yang direkomendasikan

---

## 🎯 Fase 2: Paket Bundel & Rekomendasi (Sprint 3-4)

### Paket Bundel
- **Paket Perlengkapan Dasar**: Kain ihram + sajadah + buku doa + tasbih
- **Paket Perlengkapan Lengkap**: Semua di atas + koper + tas + adaptor
- **Paket Oleh-Oleh Keluarga**: Kurma campuran + coklat + parfum + siwak
- **Paket Premium**: Semua item premium quality

### Smart Recommendation
- Berdasarkan keberangkatan user (checklist → produk yang dibutuhkan)
- Integrasi dengan checklist persiapan: "Anda belum punya kain ihram? Beli di sini"
- Rekomendasi oleh-oleh berdasarkan budget

### Database
```sql
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES shop_products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1
);
```

---

## 🎯 Fase 3: Fitur Pre-Order & Titip Beli (Sprint 5-6)

### Pre-Order Oleh-Oleh
- Jamaah bisa pesan oleh-oleh sebelum berangkat
- Agen travel mengurus pembelian di Tanah Suci
- Tracking status pembelian: Dipesan → Dibeli → Dibawa → Sampai

### Titip Beli
- User bisa request titip beli ke jamaah yang akan berangkat
- Sistem matching jamaah yang mau dititipi
- Escrow payment system

### Database
```sql
CREATE TABLE IF NOT EXISTS preorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  travel_id UUID REFERENCES travels(id),
  status TEXT DEFAULT 'pending', -- pending, purchased, in_transit, delivered
  items JSONB NOT NULL,
  total_estimate BIGINT,
  notes TEXT,
  departure_id UUID REFERENCES departures(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎯 Fase 4: Review & Sosial (Sprint 7-8)

### Review Produk
- Rating & review dari pembeli
- Foto produk dari pembeli (bukti keaslian)
- Badge "Verified Purchase"

### Konten Sosial
- "Oleh-oleh favorit jamaah" (trending)
- Tips memilih oleh-oleh (artikel/blog)
- Panduan harga oleh-oleh di Tanah Suci (referensi)

---

## 📊 Metrik Keberhasilan
| Metrik | Target Fase 1 | Target Fase 4 |
|--------|---------------|---------------|
| Produk terdaftar | 50+ | 200+ |
| Seller aktif | 5+ | 20+ |
| Transaksi/bulan | 30+ | 200+ |
| Rating rata-rata | 4.0+ | 4.5+ |

---

## 🔗 Integrasi dengan Fitur Existing
1. **Checklist** → Rekomendasi perlengkapan yang belum dimiliki
2. **Booking** → Upsell oleh-oleh & perlengkapan saat booking
3. **Agent Dashboard** → Agent bisa jual perlengkapan
4. **Packing List** → Link langsung ke produk terkait
5. **Chat** → Konsultasi produk dengan seller

---

## ⏰ Timeline Estimasi
- **Fase 1**: 2-3 minggu (Katalog dasar)
- **Fase 2**: 2-3 minggu (Bundel & rekomendasi)
- **Fase 3**: 3-4 minggu (Pre-order & titip beli)
- **Fase 4**: 2-3 minggu (Review & sosial)
- **Total**: ~10-13 minggu
