-- Add Kemitraan Landing Page to static_pages
-- This page is a full HTML landing page based on the partnership brief

INSERT INTO public.static_pages (slug, title, content, meta_title, meta_description, is_active)
VALUES (
  'kemitraan',
  'Kemitraan Arah Umroh',
  '<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kemitraan Arah Umroh - Bekal Umroh Digital</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: [''Plus Jakarta Sans'', ''sans-serif''],
          },
          colors: {
            primary: ''#10b981'', // Emerald-500
            ''primary-dark'': ''#065f46'', // Emerald-800
            gold: ''#f59e0b'', // Amber-500
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: ''Plus Jakarta Sans'', sans-serif;
      scroll-behavior: smooth;
    }
    .bg-gradient-hero {
      background: linear-gradient(180deg, #10b981 0%, #065f46 100%);
    }
    .glass {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }
    .card-shadow {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900">

  <!-- Navigation -->
  <nav class="sticky top-0 z-50 glass border-b border-slate-200">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">A</div>
        <span class="text-xl font-extrabold tracking-tight text-primary-dark">ARAH UMROH</span>
      </div>
      <div class="hidden md:flex items-center gap-8 font-medium text-slate-600">
        <a href="#masalah" class="hover:text-primary transition-colors">Masalah</a>
        <a href="#fitur" class="hover:text-primary transition-colors">Fitur</a>
        <a href="#kemitraan" class="hover:text-primary transition-colors">Kemitraan</a>
      </div>
      <a href="#cta" class="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-primary/20">
        Gabung Mitra
      </a>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="bg-gradient-hero text-white pt-20 pb-32 px-4 overflow-hidden relative">
    <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white"></path>
      </svg>
    </div>
    <div class="container mx-auto text-center relative z-10">
      <div class="inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-white/30">
        Bekal Umroh Digital • Panduan Ibadah • Media Promosi Travel
      </div>
      <h1 class="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
        Satu Aplikasi untuk <br class="hidden md:block"> Mendampingi Jamaah Umroh
      </h1>
      <p class="text-xl md:text-2xl mb-10 text-emerald-50 font-medium">
        Sebelum Berangkat • Saat Umroh • Setelah Pulang
      </p>
      <p class="max-w-2xl mx-auto text-lg text-emerald-100 mb-12 leading-relaxed">
        Arah Umroh adalah aplikasi <strong>panduan & bekal umroh digital</strong> yang membantu jamaah memahami manasik, doa, dan persiapan ibadah — sekaligus menjadi <strong>media promosi yang tepat sasaran</strong> untuk travel & agen umroh.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a href="#cta" class="bg-gold hover:bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-amber-900/20 w-full sm:w-auto">
          📩 Gabung sebagai Mitra Arah Umroh
        </a>
        <p class="text-emerald-200 italic">👉 Bukan sekadar aplikasi doa, tapi ekosistem umroh.</p>
      </div>
    </div>
  </header>

  <!-- Stats/Problem Section -->
  <section id="masalah" class="py-24 px-4 -mt-16">
    <div class="container mx-auto">
      <div class="bg-white rounded-3xl p-8 md:p-16 card-shadow border border-slate-100">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-extrabold mb-4">Kenyataan di Lapangan</h2>
          <p class="text-slate-500 text-lg">Masalah yang sering dihadapi jamaah dan travel umroh</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-12">
          <div class="space-y-6">
            <h3 class="text-2xl font-bold text-primary-dark flex items-center gap-3">
              <span class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-primary">👤</span>
              Di sisi jamaah:
            </h3>
            <ul class="space-y-4">
              <li class="flex items-start gap-3 text-slate-600">
                <span class="text-red-500 mt-1">✕</span>
                <span>Bingung urutan manasik</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="text-red-500 mt-1">✕</span>
                <span>Doa tercecer (buku, PDF, chat)</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="text-red-500 mt-1">✕</span>
                <span>Kurang persiapan ibadah & mental</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="text-red-500 mt-1">✕</span>
                <span>Tidak ada pendamping setelah pulang umroh</span>
              </li>
            </ul>
          </div>
          
          <div class="space-y-6">
            <h3 class="text-2xl font-bold text-primary-dark flex items-center gap-3">
              <span class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-primary">🏢</span>
              Di sisi travel:
            </h3>
            <ul class="space-y-4">
              <li class="flex items-start gap-3 text-slate-600">
                <span class="text-red-500 mt-1">✕</span>
                <span>Edukasi jamaah menyita waktu</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="text-red-500 mt-1">✕</span>
                <span>Iklan mahal & tidak tepat sasaran</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="text-red-500 mt-1">✕</span>
                <span>Aplikasi bekal umroh tidak terhubung ke travel</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Solution Section -->
  <section class="py-24 bg-emerald-900 text-white px-4">
    <div class="container mx-auto text-center">
      <h2 class="text-3xl md:text-5xl font-extrabold mb-8">SOLUSI: ARAH UMROH</h2>
      <p class="text-xl text-emerald-200 mb-16 max-w-3xl mx-auto">
        Arah Umroh hadir sebagai <strong>bekal umroh digital terintegrasi</strong> yang memberikan solusi nyata bagi ekosistem umroh.
      </p>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10 text-left">
          <div class="text-4xl mb-6">🗺️</div>
          <h3 class="text-xl font-bold mb-4">Memandu Bertahap</h3>
          <p class="text-emerald-100">Memandu jamaah secara bertahap dari persiapan hingga kepulangan.</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10 text-left">
          <div class="text-4xl mb-6">📅</div>
          <h3 class="text-xl font-bold mb-4">Digunakan Harian</h3>
          <p class="text-emerald-100">Digunakan harian, bukan musiman, menjaga engagement jamaah.</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10 text-left">
          <div class="text-4xl mb-6">🔗</div>
          <h3 class="text-xl font-bold mb-4">Terhubung Langsung</h3>
          <p class="text-emerald-100">Menghubungkan jamaah langsung dengan travel pilihan mereka.</p>
        </div>
      </div>
      
      <div class="mt-16 text-2xl italic font-medium text-gold">
        "Satu aplikasi, banyak manfaat."
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="fitur" class="py-24 px-4">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-extrabold mb-4">Fitur Utama Arah Umroh</h2>
        <p class="text-slate-500 text-lg">Ekosistem lengkap untuk kenyamanan ibadah dan bisnis</p>
      </div>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="bg-white p-8 rounded-2xl card-shadow border border-slate-100">
          <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-3xl mb-6">🕌</div>
          <h3 class="text-xl font-bold mb-4">Panduan Umroh & Haji</h3>
          <ul class="space-y-2 text-slate-600">
            <li>• Manasik step-by-step</li>
            <li>• Tata cara thawaf, sa’i, tahallul</li>
            <li>• Sesuai sunnah</li>
          </ul>
        </div>
        <!-- Feature 2 -->
        <div class="bg-white p-8 rounded-2xl card-shadow border border-slate-100">
          <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-3xl mb-6">🤲</div>
          <h3 class="text-xl font-bold mb-4">Doa & Ibadah</h3>
          <ul class="space-y-2 text-slate-600">
            <li>• Doa umroh lengkap</li>
            <li>• Doa sehari-hari</li>
            <li>• Dzikir & amalan</li>
          </ul>
        </div>
        <!-- Feature 3 -->
        <div class="bg-white p-8 rounded-2xl card-shadow border border-slate-100">
          <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-3xl mb-6">💡</div>
          <h3 class="text-xl font-bold mb-4">Persiapan Jamaah</h3>
          <ul class="space-y-2 text-slate-600">
            <li>• Tips umroh & haji</li>
            <li>• Fitur menabung umroh</li>
            <li>• Checklist persiapan</li>
          </ul>
        </div>
        <!-- Feature 4 -->
        <div class="bg-white p-8 rounded-2xl card-shadow border border-slate-100">
          <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-3xl mb-6">📿</div>
          <h3 class="text-xl font-bold mb-4">Pendamping Harian</h3>
          <ul class="space-y-2 text-slate-600">
            <li>• Tracker ibadah</li>
            <li>• Tracker kesehatan</li>
            <li>• Tracker makanan</li>
          </ul>
        </div>
        <!-- Feature 5 -->
        <div class="bg-white p-8 rounded-2xl card-shadow border border-slate-100">
          <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-3xl mb-6">🌙</div>
          <h3 class="text-xl font-bold mb-4">Mode Ramadhan <span class="text-xs bg-gold text-white px-2 py-0.5 rounded-full ml-2">Premium</span></h3>
          <ul class="space-y-2 text-slate-600">
            <li>• Target ibadah</li>
            <li>• Evaluasi harian</li>
            <li>• Habit Ramadhan</li>
          </ul>
        </div>
        <!-- Feature 6 -->
        <div class="bg-white p-8 rounded-2xl card-shadow border border-slate-100">
          <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-3xl mb-6">🛒</div>
          <h3 class="text-xl font-bold mb-4">Marketplace Umroh</h3>
          <ul class="space-y-2 text-slate-600">
            <li>• Listing travel & agen</li>
            <li>• Promosi paket</li>
            <li>• Iklan tepat sasaran</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Comparison Section -->
  <section class="py-24 bg-slate-100 px-4">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-extrabold mb-4">Perbandingan Aplikasi</h2>
        <p class="text-slate-500 text-lg">Kenapa Arah Umroh adalah pilihan terbaik untuk Anda</p>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full bg-white rounded-2xl overflow-hidden card-shadow">
          <thead>
            <tr class="bg-primary-dark text-white">
              <th class="px-6 py-4 text-left">Fitur</th>
              <th class="px-6 py-4 text-center">Bekal Umroh Umum</th>
              <th class="px-6 py-4 text-center">Aplikasi Doa</th>
              <th class="px-6 py-4 text-center">Marketplace</th>
              <th class="px-6 py-4 text-center bg-primary">Arah Umroh</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="px-6 py-4 font-medium">Manasik Umroh</td>
              <td class="px-6 py-4 text-center text-emerald-500">✔️</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center font-bold text-primary">✔️ Lengkap</td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium">Doa Umroh</td>
              <td class="px-6 py-4 text-center text-emerald-500">✔️</td>
              <td class="px-6 py-4 text-center text-emerald-500">✔️</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center font-bold text-primary">✔️ Terstruktur</td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium">Tips & Edukasi</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center font-bold text-primary">✔️</td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium">Dipakai Harian</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-emerald-500">✔️</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center font-bold text-primary">✔️</td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium">Terhubung Travel</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-emerald-500">✔️</td>
              <td class="px-6 py-4 text-center font-bold text-primary">✔️</td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-medium">Promosi & Revenue</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-red-400">❌</td>
              <td class="px-6 py-4 text-center text-emerald-500">✔️</td>
              <td class="px-6 py-4 text-center font-bold text-primary">✔️</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mt-12 bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
        <p class="text-lg font-bold text-primary-dark">
          Arah Umroh menggabungkan bekal umroh + pendamping ibadah + promosi travel dalam satu aplikasi.
        </p>
      </div>
    </div>
  </section>

  <!-- Target Audience -->
  <section class="py-24 px-4">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-extrabold mb-4">Untuk Siapa Aplikasi Ini?</h2>
      </div>
      
      <div class="grid md:grid-cols-2 gap-12">
        <div class="bg-white p-10 rounded-3xl card-shadow border-t-4 border-primary">
          <div class="text-4xl mb-6">🎯</div>
          <h3 class="text-2xl font-bold mb-6">Jamaah & Calon Jamaah</h3>
          <ul class="space-y-4 text-lg text-slate-600">
            <li class="flex items-center gap-3">
              <span class="text-primary">✓</span> Lebih siap secara ibadah
            </li>
            <li class="flex items-center gap-3">
              <span class="text-primary">✓</span> Lebih tenang & terarah
            </li>
          </ul>
        </div>
        
        <div class="bg-white p-10 rounded-3xl card-shadow border-t-4 border-gold">
          <div class="text-4xl mb-6">🎯</div>
          <h3 class="text-2xl font-bold mb-6">Travel & Agen Umroh</h3>
          <ul class="space-y-4 text-lg text-slate-600">
            <li class="flex items-center gap-3">
              <span class="text-gold">✓</span> Media edukasi jamaah
            </li>
            <li class="flex items-center gap-3">
              <span class="text-gold">✓</span> Branding jangka panjang
            </li>
            <li class="flex items-center gap-3">
              <span class="text-gold">✓</span> Promosi tepat sasaran
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing/Partnership Section -->
  <section id="kemitraan" class="py-24 bg-primary-dark text-white px-4">
    <div class="container mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-5xl font-extrabold mb-4">Skema Kemitraan</h2>
        <p class="text-emerald-200 text-lg">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Package A -->
        <div class="bg-white text-slate-900 p-8 rounded-3xl relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-xl font-bold text-sm">Paket A</div>
          <h3 class="text-xl font-bold mb-2">Basic Partner</h3>
          <div class="text-3xl font-extrabold mb-6 text-primary">Rp5.000.000</div>
          <ul class="space-y-4 mb-10 text-slate-600">
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> Pembayaran: 1 tahap
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> Listing iklan GRATIS 1 tahun
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> 20% revenue fitur premium
            </li>
          </ul>
          <a href="#cta" class="block text-center bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-xl font-bold transition-colors">Pilih Paket</a>
        </div>
        
        <!-- Package B -->
        <div class="bg-white text-slate-900 p-8 rounded-3xl relative overflow-hidden transform md:scale-110 z-10 shadow-2xl border-2 border-gold">
          <div class="absolute top-0 right-0 bg-gold text-white px-4 py-1 rounded-bl-xl font-bold text-sm">Paket B</div>
          <h3 class="text-xl font-bold mb-2">Growth Partner</h3>
          <div class="text-3xl font-extrabold mb-6 text-primary">Rp10.000.000</div>
          <ul class="space-y-4 mb-10 text-slate-600">
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> Pembayaran: 2 tahap
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> Semua benefit Paket A
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> 10% komisi checkout iklan agen lain
            </li>
          </ul>
          <a href="#cta" class="block text-center bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold transition-colors">Paling Populer</a>
        </div>
        
        <!-- Package C -->
        <div class="bg-white text-slate-900 p-8 rounded-3xl relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 rounded-bl-xl font-bold text-sm">Paket C</div>
          <h3 class="text-xl font-bold mb-2">Enterprise Partner</h3>
          <div class="text-3xl font-extrabold mb-6 text-primary">Rp15.000.000</div>
          <ul class="space-y-4 mb-10 text-slate-600">
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> Pembayaran: 3 tahap
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> Semua benefit Paket B
            </li>
            <li class="flex items-start gap-3">
              <span class="text-emerald-500 font-bold">✓</span> Sistem digital + website perusahaan GRATIS
            </li>
          </ul>
          <a href="#cta" class="block text-center bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-xl font-bold transition-colors">Pilih Paket</a>
        </div>
      </div>
      
      <div class="mt-24 grid md:grid-cols-4 gap-8 text-center">
        <div>
          <div class="text-3xl mb-4">💰</div>
          <h4 class="font-bold mb-2">Lebih Murah</h4>
          <p class="text-emerald-200 text-sm">Dari biaya iklan bulanan konvensional</p>
        </div>
        <div>
          <div class="text-3xl mb-4">🚀</div>
          <h4 class="font-bold mb-2">Early Access</h4>
          <p class="text-emerald-200 text-sm">Masuk lebih awal ke ekosistem digital</p>
        </div>
        <div>
          <div class="text-3xl mb-4">🤝</div>
          <h4 class="font-bold mb-2">Partner Resmi</h4>
          <p class="text-emerald-200 text-sm">Posisi strategis sebagai partner resmi</p>
        </div>
        <div>
          <div class="text-3xl mb-4">📈</div>
          <h4 class="font-bold mb-2">Passive Income</h4>
          <p class="text-emerald-200 text-sm">Potensi pendapatan dari fitur premium</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section id="cta" class="py-24 px-4">
    <div class="container mx-auto max-w-4xl">
      <div class="bg-white rounded-3xl p-8 md:p-16 card-shadow border border-slate-100 text-center">
        <h2 class="text-3xl md:text-4xl font-extrabold mb-6">Saatnya Travel Anda Tumbuh Bersama Arah Umroh</h2>
        <p class="text-xl text-slate-600 mb-10">
          Gabung sebagai mitra dan jadilah bagian dari <br class="hidden md:block">
          <strong>ekosistem bekal umroh digital Indonesia</strong>.
        </p>
        <div class="flex flex-col items-center gap-6">
          <button class="bg-primary hover:bg-primary-dark text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-xl shadow-primary/20 w-full md:w-auto">
            📲 Daftar Kemitraan Sekarang
          </button>
          <p class="text-slate-400 text-sm">Tim kami akan menghubungi Anda dalam 1x24 jam</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 bg-slate-50 border-t border-slate-200 px-4">
    <div class="container mx-auto text-center">
      <div class="flex items-center justify-center gap-2 mb-6">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
        <span class="text-lg font-extrabold tracking-tight text-primary-dark">ARAH UMROH</span>
      </div>
      <p class="text-slate-500 mb-8">
        Bekal Umroh Digital • Panduan Ibadah • Marketplace Travel
      </p>
      <div class="text-slate-400 text-sm">
        © 2026 Arah Umroh. All rights reserved.
      </div>
    </div>
  </footer>

</body>
</html>',
  'Kemitraan Arah Umroh - Bekal Umroh Digital',
  'Gabung sebagai mitra Arah Umroh dan jadilah bagian dari ekosistem bekal umroh digital Indonesia. Solusi tepat sasaran untuk travel & agen umroh.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  is_active = EXCLUDED.is_active,
  updated_at = now();
