# HTML/CSS/JavaScript Page Builder - Dokumentasi Fitur

## 📋 Ringkasan

Fitur **HTML/CSS/JavaScript Page Builder** memungkinkan admin untuk membuat landing pages interaktif dengan HTML, CSS, dan JavaScript langsung dari dashboard admin. Fitur ini memberikan fleksibilitas penuh dalam desain dan fungsionalitas halaman.

## 🎯 Fitur Utama

### 1. **HTML/CSS/JavaScript Editor**
- Editor terpisah untuk HTML, CSS, dan JavaScript dengan syntax highlighting
- Live preview real-time dari halaman yang dibuat
- Validasi kode otomatis
- 4 tab editor: HTML, CSS, JavaScript, dan Preview

### 2. **Template Starter**
Tersedia 5 template siap pakai untuk mempercepat pembuatan:
- **Blank** - Template kosong untuk custom design
- **Hero Section** - Landing page dengan hero section dan button interaktif
- **Two Column** - Layout dua kolom responsif
- **Features Grid** - Grid fitur dengan 3 kolom dan hover effect
- **Interactive Form** - Formulir dengan validasi dan feedback

### 3. **Preview Real-Time**
- Preview halaman langsung di iframe dengan JavaScript berjalan
- Responsive design preview
- Lihat hasil styling CSS dan interaksi JavaScript secara instant

### 4. **Download & Copy**
- Salin kode HTML/CSS/JavaScript ke clipboard
- Download file HTML lengkap untuk backup atau digunakan di tempat lain

### 5. **JavaScript Support**
- Eksekusi JavaScript dalam sandbox yang aman
- Akses DOM penuh untuk manipulasi elemen
- Event handling (click, submit, change, dll)
- Alert, console.log, dan API browser lainnya

## 🚀 Cara Menggunakan

### Membuat Halaman Baru dengan HTML/CSS/JavaScript

1. **Buka Dashboard Admin** → **Manajemen Halaman**
2. Klik tombol **"Buat Halaman Baru"**
3. Isi **Judul Halaman** dan **URL Halaman**
4. **Aktifkan toggle "Gunakan HTML/CSS Editor"** di tab Konten
5. Buka tab **"HTML/CSS"**
6. Pilih template starter atau mulai dari kosong
7. Edit HTML, CSS, dan JavaScript sesuai kebutuhan:
   - Tab **HTML**: Struktur halaman
   - Tab **CSS**: Styling halaman
   - Tab **JavaScript**: Interaksi dan logika
8. Lihat preview di tab **"Preview"** (JavaScript akan berjalan)
9. Klik **"Buat Halaman"** untuk menyimpan

### Mengedit Halaman Existing

1. Buka halaman yang ingin diedit
2. Jika halaman menggunakan HTML/CSS/JavaScript, toggle akan otomatis aktif
3. Edit HTML/CSS/JavaScript di tab **"HTML/CSS"**
4. Simpan perubahan

### Menggunakan Template

1. Di tab **"HTML/CSS"**, klik salah satu template:
   - Blank
   - Hero Section
   - Two Column
   - Features Grid
   - Interactive Form
2. Template akan otomatis diterapkan ke ketiga editor
3. Sesuaikan konten, styling, dan logika sesuai kebutuhan

## 📝 Contoh Penggunaan

### Contoh 1: Hero Section dengan JavaScript

**HTML:**
```html
<section class="hero">
  <div class="hero-content">
    <h1>Selamat Datang</h1>
    <p>Klik tombol di bawah untuk memulai</p>
    <button class="cta-button" onclick="handleClick()">Mulai Sekarang</button>
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

.cta-button {
  background-color: white;
  color: #667eea;
  padding: 12px 30px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.cta-button:hover {
  transform: scale(1.05);
}
```

**JavaScript:**
```javascript
function handleClick() {
  alert("Terima kasih telah mengklik tombol!");
  console.log("Tombol diklik pada:", new Date().toLocaleString());
}
```

### Contoh 2: Formulir Interaktif dengan Validasi

**HTML:**
```html
<div class="container">
  <div class="form-wrapper">
    <h2>Hubungi Kami</h2>
    <form id="contactForm">
      <div class="form-group">
        <label for="name">Nama:</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div class="form-group">
        <label for="message">Pesan:</label>
        <textarea id="message" name="message" rows="5" required></textarea>
      </div>
      <button type="submit" class="submit-btn">Kirim Pesan</button>
    </form>
    <div id="successMessage" class="hidden">Pesan berhasil dikirim!</div>
  </div>
</div>
```

**CSS:**
```css
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}

.form-wrapper {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.submit-btn {
  background-color: #667eea;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.submit-btn:hover {
  background-color: #5568d3;
}

.hidden {
  display: none;
}

.success {
  display: block;
  color: #22863a;
  background-color: #f0f8f4;
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
}
```

**JavaScript:**
```javascript
document.getElementById("contactForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const message = document.getElementById("message").value;
  
  console.log("Form submitted:", { name, email, message });
  
  // Reset form
  this.reset();
  
  // Show success message
  const successMsg = document.getElementById("successMessage");
  successMsg.classList.remove("hidden");
  successMsg.classList.add("success");
  
  // Hide after 3 seconds
  setTimeout(() => {
    successMsg.classList.add("hidden");
    successMsg.classList.remove("success");
  }, 3000);
});
```

### Contoh 3: Tab Switcher Interaktif

**HTML:**
```html
<div class="container">
  <div class="tabs">
    <button class="tab-button active" data-tab="tab1">Tab 1</button>
    <button class="tab-button" data-tab="tab2">Tab 2</button>
    <button class="tab-button" data-tab="tab3">Tab 3</button>
  </div>
  
  <div id="tab1" class="tab-content active">
    <h2>Konten Tab 1</h2>
    <p>Ini adalah konten untuk tab pertama</p>
  </div>
  
  <div id="tab2" class="tab-content">
    <h2>Konten Tab 2</h2>
    <p>Ini adalah konten untuk tab kedua</p>
  </div>
  
  <div id="tab3" class="tab-content">
    <h2>Konten Tab 3</h2>
    <p>Ini adalah konten untuk tab ketiga</p>
  </div>
</div>
```

**CSS:**
```css
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-button:hover {
  color: #667eea;
}

.tab-content {
  display: none;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
}

.tab-content.active {
  display: block;
}
```

**JavaScript:**
```javascript
document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", function() {
    const tabId = this.getAttribute("data-tab");
    
    // Remove active class from all buttons and contents
    document.querySelectorAll(".tab-button").forEach(btn => {
      btn.classList.remove("active");
    });
    document.querySelectorAll(".tab-content").forEach(content => {
      content.classList.remove("active");
    });
    
    // Add active class to clicked button and corresponding content
    this.classList.add("active");
    document.getElementById(tabId).classList.add("active");
  });
});
```

## 🎨 Best Practices

### 1. **HTML - Gunakan Semantic HTML**
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

### 2. **CSS - Gunakan Class Selectors**
```css
/* ✅ Baik */
.button {
  padding: 10px 20px;
}

/* ❌ Hindari */
button {
  padding: 10px 20px;
}
```

### 3. **CSS - Responsive Design**
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

### 4. **JavaScript - Event Delegation**
```javascript
/* ✅ Baik - Event delegation */
document.addEventListener("click", function(e) {
  if (e.target.classList.contains("button")) {
    handleButtonClick(e.target);
  }
});

/* ❌ Hindari - Menambah listener ke setiap elemen */
document.querySelectorAll(".button").forEach(btn => {
  btn.addEventListener("click", handleButtonClick);
});
```

### 5. **JavaScript - Hindari Inline Event Handlers (Optional)**
```html
<!-- ✅ Baik -->
<button class="submit-btn">Kirim</button>

<!-- Juga OK untuk kasus sederhana -->
<button onclick="handleClick()">Kirim</button>
```

### 6. **JavaScript - Gunakan Modern JavaScript**
```javascript
/* ✅ Baik */
const elements = document.querySelectorAll(".item");
elements.forEach(el => {
  el.addEventListener("click", handleClick);
});

/* ❌ Hindari -->
var elements = document.getElementsByClassName("item");
for (var i = 0; i < elements.length; i++) {
  elements[i].onclick = handleClick;
}
```

## 🔒 Keamanan

- Kode HTML/CSS/JavaScript disimpan sebagai plain text di database
- JavaScript berjalan dalam sandbox iframe dengan batasan:
  - Tidak dapat mengakses parent window
  - Tidak dapat membuat request ke domain lain (CORS)
  - Tidak dapat mengakses localStorage/sessionStorage dari parent
- Hanya admin yang dapat membuat/mengedit halaman
- Halaman dapat diaktifkan/nonaktifkan kapan saja
- Hindari menggunakan `eval()` dan kode berbahaya

## 📊 Struktur Data

Halaman dengan HTML/CSS/JavaScript disimpan dalam format:

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
  <script>
    // JavaScript disimpan di sini
  </script>
</body>
</html>
```

Ketika ditampilkan, halaman dirender dalam iframe dengan sandbox untuk keamanan.

## 🐛 Troubleshooting

### JavaScript tidak berjalan di preview
- Pastikan tidak ada error di console browser
- Cek syntax JavaScript
- Refresh halaman preview

### Event listener tidak bekerja
- Pastikan elemen sudah ada di DOM saat script berjalan
- Gunakan `DOMContentLoaded` jika diperlukan
- Cek selector CSS yang digunakan

### Styling tidak diterapkan
- Pastikan menggunakan class selectors
- Cek specificity CSS
- Hindari inline styles yang override

### Halaman tidak responsif
- Tambahkan `<meta name="viewport">` (sudah otomatis)
- Gunakan CSS media queries
- Test di berbagai ukuran layar

## 🎓 JavaScript API yang Tersedia

### DOM Manipulation
```javascript
document.getElementById(id)
document.querySelector(selector)
document.querySelectorAll(selector)
element.innerHTML
element.textContent
element.classList.add/remove/toggle
element.style.property
```

### Event Handling
```javascript
element.addEventListener(event, callback)
element.removeEventListener(event, callback)
```

### Timing
```javascript
setTimeout(callback, ms)
setInterval(callback, ms)
clearTimeout(id)
clearInterval(id)
```

### Console
```javascript
console.log(message)
console.error(message)
console.warn(message)
```

### Dialog
```javascript
alert(message)
confirm(message)
prompt(message)
```

## 📚 Resources

- [MDN Web Docs - HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [MDN Web Docs - CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [JavaScript Event Reference](https://developer.mozilla.org/en-US/docs/Web/Events)

## 🔄 Versi

- **v1.0** - Initial release dengan HTML/CSS editor, 4 templates, dan live preview
- **v2.0** - Menambahkan dukungan JavaScript, 5 templates, dan sandbox execution

## 📞 Support

Untuk pertanyaan atau masalah, hubungi tim development.
