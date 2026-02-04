# Roadmap Pengembangan Fitur Landing Page Builder (Umroh Connect)

## 1. Pendahuluan

Dokumen ini menguraikan rencana pengembangan dan perbaikan fitur manajemen halaman pada dashboard admin Umroh Connect, dengan fokus pada implementasi **Visual Page Builder** untuk pembuatan landing page. Tujuan utama adalah memungkinkan administrator untuk merancang dan menyusun landing page yang dinamis dan menarik menggunakan komponen modular tanpa memerlukan keahlian pengkodean HTML manual. Roadmap ini mencakup perubahan struktur data, arsitektur editor, pengembangan komponen, kontrol UI, dan mesin rendering.

## 2. Analisis Struktur Saat Ini

Sistem manajemen halaman saat ini menggunakan tabel `static_pages` (atau `pages` seperti yang disebutkan dalam SQL awal) di Supabase. Halaman-halaman ini disimpan dengan `content` dalam format HTML atau teks biasa, dan dirender menggunakan `PageHtmlEditor.tsx` di sisi admin dan `PageDetail.tsx` di sisi publik. `PageDetail.tsx` saat ini memiliki logika untuk mendeteksi apakah konten adalah dokumen HTML lengkap dan merendernya dalam `iframe`.

```typescript
// src/components/admin/PagesManagement.tsx
interface Page {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// src/pages/PageDetail.tsx
// ...
const isFullHtml = page.content?.includes("<!DOCTYPE html>") || page.content?.includes("<html");

if (isFullHtml) {
  return (
    <div className="min-h-screen w-full bg-white relative">
      <iframe
        key={page.id}
        srcDoc={page.content || ""}
        title={page.title}
        className="w-full h-screen border-none"
        sandbox="allow-scripts allow-same-origin allow-forms"
        style={{ display: "block" }}
      />
      {/* ... */}
    </div>
  );
}
// ...
```

## 3. Tujuan Proyek

**Mengubah fitur PagesManagement standar menjadi Visual Page Builder yang memungkinkan admin untuk menyusun landing page menggunakan komponen modular (Hero, Features, Testimonial, dll) tanpa perlu coding HTML manual.**

## 4. Tahapan Pengembangan

### Tahap 1: Perubahan Struktur Data (Backend)

Sebelum membangun antarmuka pengguna, struktur data halaman di database Supabase perlu diadaptasi untuk mendukung model berbasis komponen.

**Tugas:**

*   **Alter Table `public.pages`:** Menambahkan kolom `layout_data` (JSONB) untuk menyimpan konfigurasi komponen dan `page_type` (VARCHAR) untuk membedakan jenis halaman.
    *   `content` (TEXT): Akan tetap menyimpan hasil render HTML akhir (untuk SEO/Public view). Ini bisa dihasilkan dari `layout_data` atau diisi manual untuk halaman `standard`.
    *   `layout_data` (JSONB): Menyimpan *state* editor (urutan section, properti gambar, teks, dll.).
    *   `page_type` (VARCHAR): Menentukan jenis editor: `'standard'` (rich text biasa) atau `'builder'` (visual blocks).

**Contoh Struktur JSON `layout_data`:**

```json
[
  {
    "id": "section-1",
    "type": "HERO_SECTION",
    "props": {
      "title": "Paket Umroh Eksklusif",
      "subtitle": "Perjalanan spiritual yang nyaman",
      "backgroundImage": "url_to_image",
      "ctaText": "Daftar Sekarang",
      "ctaLink": "/paket"
    }
  },
  {
    "id": "section-2",
    "type": "FEATURE_GRID",
    "props": {
      "items": [
        { "icon": "icon-url", "title": "Pelayanan Prima", "description": "Deskripsi" },
        { "icon": "icon-url", "title": "Akomodasi Nyaman", "description": "Deskripsi" }
      ]
    }
  }
]
```

### Tahap 2: Arsitektur Editor (Frontend Core)

Membangun kerangka kerja dasar untuk editor visual di sisi frontend.

**Tugas:**

*   **Buat Komponen `VisualPageEditor.tsx`:**
    *   Komponen ini akan menggantikan `PageHtmlEditor.tsx` atau menjadi alternatifnya jika `page_type` adalah `'builder'`.
    *   Membagi tata letak menjadi 2 bagian utama: **Sidebar** (untuk Tools/Settings) dan **Canvas** (untuk Live Preview).
*   **State Management:**
    *   Implementasikan *hook* `usePageBuilder` (atau sejenisnya) untuk mengelola *state* `layout_data`.
    *   Fungsi-fungsi inti yang diperlukan: `addSection`, `removeSection`, `moveSectionUp`, `moveSectionDown`, `updateSectionProps`.

### Tahap 3: Perpustakaan Komponen (The "Legos")

Mengembangkan koleksi komponen UI yang dapat digunakan admin untuk membangun halaman. Komponen-komponen ini harus *stateless* dan menerima data melalui `props`.

**Daftar Komponen Prioritas:**

*   **`HeroSection`:** Gambar besar dengan judul utama, sub-judul, dan tombol aksi (CTA).
*   **`RichTextSection`:** Area teks bebas dengan editor WYSIWYG sederhana.
*   **`FeaturesGrid`:** Grid kolom (misalnya 3 kolom) untuk menampilkan keunggulan produk/layanan (ikon + judul + deskripsi).
*   **`PackageCarousel` (Advanced):** Menampilkan daftar paket umroh yang diambil secara dinamis dari database.
*   **`TestimonialSlider`:** Menampilkan ulasan atau testimoni dari jamaah.
*   **`CallToAction (CTA)`:** Banner ajakan bertindak dengan teks dan tautan yang dapat disesuaikan.
*   **`FAQSection`:** Bagian Tanya Jawab dengan format akordeon.

### Tahap 4: UI Kontrol & Customization

Memberikan admin kemampuan untuk memanipulasi dan menyesuaikan properti komponen yang dipilih.

**Tugas:**

*   **Sidebar Properties Panel:**
    *   Ketika sebuah komponen di Canvas diklik, Sidebar akan menampilkan formulir input yang relevan dengan tipe komponen tersebut.
    *   Contoh: Untuk `HeroSection`, akan ada input untuk mengubah Judul, mengunggah Gambar Latar Belakang, memilih Warna Teks, dll.
*   **Layout Controls:**
    *   Tombol 
"Naik/Turun" untuk mengubah urutan section.
    *   Tombol "Hapus" untuk menghapus section.
    *   Tombol *toggle* "Visible/Hidden" untuk menyembunyikan atau menampilkan section.
*   **Responsive Preview:**
    *   Tombol untuk melihat tampilan halaman dalam mode Mobile, Tablet, dan Desktop.

### Tahap 5: Rendering Engine (Public View)

Memastikan halaman yang dibuat dengan Page Builder dapat ditampilkan dengan benar kepada pengguna akhir (jamaah).

**Tugas:**

*   **Update `PageDetail.tsx`:**
    *   Implementasikan logika baru: Periksa apakah `layout_data` ada isinya dan `page_type` adalah `builder`.
    *   Jika ya, lakukan *looping* (`map`) terhadap array `layout_data`.
    *   Gunakan pernyataan `switch-case` berdasarkan properti `type` komponen untuk merender komponen React yang sesuai (misalnya, jika `type="HERO_SECTION"`, render komponen `<HeroSectionRenderer />`).
    *   **Performance:** Pastikan gambar dan aset lainnya dioptimalkan untuk kecepatan pemuatan halaman.

## 5. Ringkasan Teknis (Untuk Developer)

### 5.1. Struktur Folder Baru

```
src/
  components/
    admin/
      PageHtmlEditor.tsx
      PagesManagement.tsx
      VisualPageEditor.tsx       # Komponen utama editor visual
    page-builder/                # Folder untuk komponen Page Builder
      PageBuilderCanvas.tsx      # Area preview halaman
      PageBuilderSidebar.tsx     # Panel kontrol dan properti
      renderers/                 # Komponen yang dirender di public view dan canvas
        HeroSectionRenderer.tsx
        RichTextSectionRenderer.tsx
        FeaturesGridRenderer.tsx
        PackageCarouselRenderer.tsx
        TestimonialSliderRenderer.tsx
        CallToActionRenderer.tsx
        FAQSectionRenderer.tsx
      controls/                  # Input kontrol khusus editor (misalnya ImageUploader, ColorPicker)
        ImageUploader.tsx
        ColorPicker.tsx
      hooks/
        usePageBuilder.ts          # Hook untuk state management editor
      types/
        page-builder.d.ts          # Definisi tipe untuk layout_data dan komponen
  pages/
    AdminDashboard.tsx
    PageDetail.tsx               # Akan diupdate untuk merender layout_data
  integrations/
    supabase/
      client.ts
      types.ts                   # Akan diupdate dengan tipe baru untuk pages
  hooks/
    usePages.ts                  # Akan diupdate untuk mengambil layout_data dan page_type
```

### 5.2. Schema Database (SQL)

```sql
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS layout_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS page_type VARCHAR(50) DEFAULT 'standard';

ALTER TABLE public.pages 
ADD CONSTRAINT check_page_type CHECK (page_type IN ('standard', 'builder'));

COMMENT ON COLUMN public.pages.layout_data IS 'Menyimpan struktur komponen JSON untuk visual builder';
COMMENT ON COLUMN public.pages.page_type IS 'Menentukan jenis editor: standard (rich text) atau builder (visual blocks)';

-- Update halaman yang sudah ada agar memiliki tipe 'standard' secara eksplisit
UPDATE public.pages SET page_type = 'standard' WHERE page_type IS NULL;
```

### 5.3. Estimasi Pengerjaan

| Tahap                               | Estimasi Waktu |
| :---------------------------------- | :------------- |
| Setup Database & Core Editor Logic  | 1 Minggu       |
| Pembuatan Komponen Dasar & Panel Properti | 1 Minggu       |
| Komponen Lanjutan & Public Rendering | 1 Minggu       |
| Polishing, Testing, & Responsiveness | 1 Minggu       |
| **Total**                           | **4 Minggu**   |

## 6. Referensi

*   [1] Stack Overflow. *Edit JSON file from a React App - Page Builder Concept*. [https://stackoverflow.com/questions/64550458/edit-json-file-from-a-react-app-page-builder-concept](https://stackoverflow.com/questions/64550458/edit-json-file-from-a-react-app-page-builder-concept)
*   [2] Anton Ball. *Getting started with JSON React Layouts*. [https://www.antonball.dev/blog/2019-09-11-json-react-layouts/](https://www.antonball.dev/blog/2019-09-11-json-react-layouts/)
*   [3] Reddit. *Good way to render components that come as JSON from ...*. [https://www.reddit.com/r/reactjs/comments/16ed4fv/good_way_to_render_components_that_come_as_json/](https://www.reddit.com/r/reactjs/comments/16ed4fv/good_way_to_render_components_that_come_as_json/)
*   [4] Puck. *How to Build a React Page Builder: Puck and Tailwind v4*. [https://puckeditor.com/blog/how-to-build-a-react-page-builder-puck-and-tailwind-4](https://puckeditor.com/blog/how-to-build-a-react-page-builder-puck-and-tailwind-4)
*   [5] GitHub. *hello-pangea/dnd*. [https://github.com/hello-pangea/dnd](https://github.com/hello-pangea/dnd)
*   [6] Supabase. *pg_jsonschema: JSON Schema support for Postgres*. [https://supabase.com/blog/pg-jsonschema-a-postgres-extension-for-json-validation](https://supabase.com/blog/pg-jsonschema-a-postgres-extension-for-json-validation)
*   [7] Supabase. *Managing JSON and unstructured data*. [https://supabase.com/docs/guides/database/json](https://supabase.com/docs/guides/database/json)

---

**Author:** Manus AI
**Date:** February 5, 2026
