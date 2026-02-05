# Rencana Pengembangan Visual Block Builder - Umroh Connect

Dokumen ini merinci rencana pengembangan dan detail teknis untuk meningkatkan fitur **Visual Block Builder** pada platform Umroh Connect.

## 🚀 Status Saat Ini: Fase 1 Selesai
Fase 1 telah diimplementasikan untuk meningkatkan UX dasar, responsivitas, dan kontrol desain per blok.

### Fitur yang Baru Ditambahkan (Fase 1):
1.  **Responsive Preview Toggles**: Admin dapat beralih antara tampilan Desktop (100%), Tablet (768px), dan Mobile (375px) di tab Preview.
2.  **Advanced Styling Tab**: Setiap blok kini memiliki tab "Pengaturan" tambahan untuk:
    *   **Padding Atas/Bawah**: Mengatur jarak vertikal blok (None, Small, Medium, Large, XL).
    *   **Custom Background Color**: Mengatur warna latar belakang spesifik untuk blok tersebut.
    *   **Custom CSS Class**: Menambahkan class CSS tambahan untuk styling tingkat lanjut.
3.  **Visibility Control**: Tombol "Mata" di daftar blok untuk menyembunyikan/menampilkan blok tanpa harus menghapusnya.

---

## 📅 Roadmap Pengembangan Selanjutnya

### Fase 2: Integrasi Data Dinamis & Media
*   **Smart Query Blocks**: Blok *Packages* akan mengambil data asli dari tabel `packages` di Supabase berdasarkan filter (kategori, limit).
*   **Media Library**: Integrasi input gambar dengan storage Supabase (bukan hanya URL teks).
*   **Blok Baru**:
    *   *Gallery*: Grid gambar dengan lightbox.
    *   *Video*: Embed YouTube/Vimeo dengan opsi autoplay/loop.

### Fase 3: Fitur Pro & WYSIWYG
*   **Split-Screen Editor**: Tampilan layar terbagi (Kiri: Editor, Kanan: Live Preview).
*   **Template System**: Kemampuan menyimpan susunan blok sebagai template untuk digunakan kembali.
*   **Undo/Redo**: Riwayat perubahan untuk membatalkan kesalahan edit.

---

## 🛠️ Detail Teknis Implementasi (Fase 1)

### 1. Perubahan Struktur Data (`src/types/blocks.ts`)
Menambahkan properti `settings` opsional pada interface `BlockData`.

```typescript
export interface BlockData {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  order: number;
  settings?: {
    paddingTop?: string;
    paddingBottom?: string;
    backgroundColor?: string;
    customClass?: string;
    isVisible?: boolean;
  };
}
```

### 2. Komponen Editor Baru (`src/components/blocks/BlockEditors.tsx`)
Memperkenalkan `AdvancedSettingsEditor` dan memperbarui `BlockEditor` untuk menggunakan sistem Tab.

```tsx
export function AdvancedSettingsEditor({ block, onChange }: BlockEditorProps) {
  // Implementasi form untuk padding, warna, dan class
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">Konten</TabsTrigger>
        <TabsTrigger value="settings">Pengaturan</TabsTrigger>
      </TabsList>
      {/* ... */}
    </Tabs>
  );
}
```

### 3. Pembaruan Renderer (`src/components/blocks/BlockRenderers.tsx`)
Memperbarui fungsi `renderBlock` untuk membungkus output HTML dengan wrapper yang membawa gaya dari `settings`.

```typescript
export function renderBlock(block: BlockData): string {
  if (block.settings?.isVisible === false) return '';
  
  let html = // ... render content based on type
  
  const s = block.settings;
  if (s) {
    return `
      <div class="${s.paddingTop} ${s.paddingBottom} ${s.customClass}" 
           style="background-color: ${s.backgroundColor};">
        ${html}
      </div>
    `;
  }
  return html;
}
```

---

## 💡 Cara Penggunaan Bagi Admin
1.  Buka **Pages Management** di Dashboard Admin.
2.  Pilih atau buat halaman dengan tipe **Builder**.
3.  Klik pada salah satu blok di daftar "Urutan Blok".
4.  Gunakan tab **Konten** untuk mengubah teks/gambar.
5.  Gunakan tab **Pengaturan** untuk mengatur jarak (padding) dan warna latar belakang.
6.  Klik tab **Preview** dan gunakan ikon **Monitor/Tablet/HP** untuk melihat responsivitas halaman.
