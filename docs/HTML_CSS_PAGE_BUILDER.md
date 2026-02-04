# HTML/CSS Page Builder - Dokumentasi Fitur

## 📋 Ringkasan

Fitur **HTML/CSS Page Builder** memungkinkan admin untuk membuat landing pages custom menggunakan HTML dan CSS langsung dari dashboard admin. Fitur ini memberikan fleksibilitas penuh dalam desain halaman sambil tetap mudah digunakan.

## 🎯 Fitur Utama

### 1. **HTML/CSS Editor**
- Editor terpisah untuk HTML dan CSS dengan syntax highlighting
- Live preview real-time dari halaman yang dibuat
- Validasi kode otomatis

### 2. **Template Starter**
Tersedia 4 template siap pakai untuk mempercepat pembuatan:
- **Blank** - Template kosong untuk custom design
- **Hero Section** - Landing page dengan hero section
- **Two Column** - Layout dua kolom
- **Features Grid** - Grid fitur dengan 3 kolom

### 3. **Preview Real-Time**
- Preview halaman langsung di iframe
- Responsive design preview
- Lihat hasil styling CSS secara instant

### 4. **Download & Copy**
- Salin kode HTML/CSS ke clipboard
- Download file HTML lengkap untuk backup atau digunakan di tempat lain

## 🚀 Cara Menggunakan

### Membuat Halaman Baru dengan HTML/CSS

1. **Buka Dashboard Admin** → **Manajemen Halaman**
2. Klik tombol **"Buat Halaman Baru"**
3. Isi **Judul Halaman** dan **URL Halaman**
4. **Aktifkan toggle "Gunakan HTML/CSS Editor"** di tab Konten
5. Buka tab **"HTML/CSS"**
6. Pilih template starter atau mulai dari kosong
7. Edit HTML dan CSS sesuai kebutuhan
8. Lihat preview di tab **"Preview"**
9. Klik **"Buat Halaman"** untuk menyimpan

### Mengedit Halaman Existing

1. Buka halaman yang ingin diedit
2. Jika halaman menggunakan HTML/CSS, toggle akan otomatis aktif
3. Edit HTML/CSS di tab **"HTML/CSS"**
4. Simpan perubahan

### Menggunakan Template

1. Di tab **"HTML/CSS"**, klik salah satu template:
   - Blank
   - Hero Section
   - Two Column
   - Features Grid
2. Template akan otomatis diterapkan ke editor
3. Sesuaikan konten dan styling sesuai kebutuhan

## 📝 Contoh Penggunaan

### Contoh 1: Hero Section Sederhana

**HTML:**
```html
<section class="hero">
  <div class="hero-content">
    <h1>Selamat Datang di Arah Umroh</h1>
    <p>Panduan lengkap perjalanan umroh Anda</p>
    <button class="cta-button">Mulai Sekarang</button>
  </div>
</section>
```

**CSS:**
```css
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 20px;
  text-align: center;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  font-weight: bold;
}

.cta-button {
  background-color: white;
  color: #667eea;
  padding: 12px 30px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
```

### Contoh 2: Responsive Grid

**HTML:**
```html
<div class="container">
  <h2>Layanan Kami</h2>
  <div class="service-grid">
    <div class="service-card">
      <h3>Paket Umroh</h3>
      <p>Berbagai pilihan paket umroh terjangkau</p>
    </div>
    <div class="service-card">
      <h3>Panduan Ibadah</h3>
      <p>Panduan lengkap ibadah umroh</p>
    </div>
    <div class="service-card">
      <h3>Konsultasi</h3>
      <p>Konsultasi gratis dengan ahli</p>
    </div>
  </div>
</div>
```

**CSS:**
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.service-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  transition: transform 0.3s ease;
}

.service-card:hover {
  transform: translateY(-5px);
}

@media (max-width: 768px) {
  .service-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🎨 Best Practices

### 1. **Gunakan Class Selectors**
```css
/* ✅ Baik */
.hero { ... }
.button { ... }

/* ❌ Hindari */
h1 { ... }
button { ... }
```

### 2. **Responsive Design**
```css
/* Mobile First */
.container {
  padding: 20px;
}

/* Tablet dan Desktop */
@media (min-width: 768px) {
  .container {
    padding: 40px;
  }
}
```

### 3. **Semantic HTML**
```html
<!-- ✅ Baik -->
<section class="hero">
  <h1>Judul</h1>
  <p>Deskripsi</p>
</section>

<!-- ❌ Hindari -->
<div class="hero">
  <div>Judul</div>
  <div>Deskripsi</div>
</div>
```

### 4. **Hindari Inline Styles**
```html
<!-- ✅ Baik -->
<div class="card">Konten</div>
<!-- CSS: .card { padding: 20px; } -->

<!-- ❌ Hindari -->
<div style="padding: 20px;">Konten</div>
```

## 🔒 Keamanan

- Kode HTML/CSS disimpan sebagai plain text di database
- Tidak ada eksekusi JavaScript (sandbox iframe)
- Hanya admin yang dapat membuat/mengedit halaman
- Halaman dapat diaktifkan/nonaktifkan kapan saja

## 📊 Struktur Data

Halaman dengan HTML/CSS disimpan dalam format:

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* CSS disimpan di sini */
  </style>
</head>
<body>
  <!-- HTML disimpan di sini -->
</body>
</html>
```

Ketika ditampilkan, halaman dirender dalam iframe dengan sandbox untuk keamanan.

## 🐛 Troubleshooting

### Preview tidak muncul
- Pastikan HTML dan CSS valid
- Cek browser console untuk error
- Refresh halaman

### Styling tidak diterapkan
- Pastikan menggunakan class selectors
- Cek specificity CSS
- Hindari inline styles yang override

### Halaman tidak responsif
- Tambahkan `<meta name="viewport">` (sudah otomatis)
- Gunakan CSS media queries
- Test di berbagai ukuran layar

## 📚 Resources

- [MDN Web Docs - HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [MDN Web Docs - CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

## 🔄 Versi

- **v1.0** - Initial release dengan HTML/CSS editor, 4 templates, dan live preview

## 📞 Support

Untuk pertanyaan atau masalah, hubungi tim development.
