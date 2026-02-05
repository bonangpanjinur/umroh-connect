// Block editor components for editing individual blocks

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlockData, HeroBlockContent, FeaturesBlockContent, TestimonialsBlockContent, PackagesBlockContent, FAQBlockContent, ContactBlockContent, RichTextBlockContent } from '@/types/blocks';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Trash2, Plus } from 'lucide-react';

interface BlockEditorProps {
  block: BlockData;
  onChange: (block: BlockData) => void;
}

export function HeroBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as HeroBlockContent;

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      content: { ...content, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Judul</Label>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Masukkan judul hero section"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Textarea
          value={content.subtitle}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="Masukkan subtitle"
          rows={3}
        />
      </div>
      <div>
        <Label>Warna Latar Belakang</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={content.backgroundColor || '#8B5CF6'}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <Input
            value={content.backgroundColor || '#8B5CF6'}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            placeholder="#8B5CF6"
            className="flex-1"
          />
        </div>
      </div>
      <div>
        <Label>Warna Teks</Label>
        <Select value={content.textColor || 'white'} onValueChange={(v) => handleChange('textColor', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="white">Putih</SelectItem>
            <SelectItem value="dark">Gelap</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Alignment</Label>
        <Select value={content.alignment || 'center'} onValueChange={(v) => handleChange('alignment', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Kiri</SelectItem>
            <SelectItem value="center">Tengah</SelectItem>
            <SelectItem value="right">Kanan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Teks Tombol CTA</Label>
        <Input
          value={content.ctaText || ''}
          onChange={(e) => handleChange('ctaText', e.target.value)}
          placeholder="Daftar Sekarang"
        />
      </div>
      <div>
        <Label>Link Tombol CTA</Label>
        <Input
          value={content.ctaLink || ''}
          onChange={(e) => handleChange('ctaLink', e.target.value)}
          placeholder="/register"
        />
      </div>
    </div>
  );
}

export function FeaturesBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as FeaturesBlockContent;

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      content: { ...content, [key]: value },
    });
  };

  const handleFeatureChange = (idx: number, key: string, value: string) => {
    const features = [...content.features];
    features[idx] = { ...features[idx], [key]: value };
    handleChange('features', features);
  };

  const addFeature = () => {
    handleChange('features', [
      ...content.features,
      { icon: '✨', title: 'Fitur Baru', description: 'Deskripsi fitur' },
    ]);
  };

  const removeFeature = (idx: number) => {
    handleChange('features', content.features.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Judul</Label>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Mengapa Memilih Kami?"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="Subtitle (opsional)"
        />
      </div>
      <div>
        <Label>Jumlah Kolom</Label>
        <Select value={String(content.columns || 3)} onValueChange={(v) => handleChange('columns', parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Kolom</SelectItem>
            <SelectItem value="3">3 Kolom</SelectItem>
            <SelectItem value="4">4 Kolom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-base font-semibold">Fitur-Fitur</Label>
          <Button size="sm" onClick={addFeature}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Fitur
          </Button>
        </div>

        <div className="space-y-4">
          {content.features.map((feature, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-medium">Fitur {idx + 1}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFeature(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <Label className="text-sm">Ikon (emoji)</Label>
                <Input
                  value={feature.icon}
                  onChange={(e) => handleFeatureChange(idx, 'icon', e.target.value)}
                  placeholder="🚀"
                  maxLength={2}
                />
              </div>
              <div>
                <Label className="text-sm">Judul</Label>
                <Input
                  value={feature.title}
                  onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                  placeholder="Judul fitur"
                />
              </div>
              <div>
                <Label className="text-sm">Deskripsi</Label>
                <Textarea
                  value={feature.description}
                  onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                  placeholder="Deskripsi fitur"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TestimonialsBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as TestimonialsBlockContent;

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      content: { ...content, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Judul</Label>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Testimoni Jamaah"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="Subtitle (opsional)"
        />
      </div>
      <div>
        <Label>Jumlah Testimoni</Label>
        <Input
          type="number"
          value={content.limit || 6}
          onChange={(e) => handleChange('limit', parseInt(e.target.value))}
          min={1}
          max={20}
        />
      </div>
      <div>
        <Label>Layout</Label>
        <Select value={content.layout || 'grid'} onValueChange={(v) => handleChange('layout', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={content.showRating || false}
            onChange={(e) => handleChange('showRating', e.target.checked)}
          />
          <span className="text-sm">Tampilkan Rating</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={content.showVerified || false}
            onChange={(e) => handleChange('showVerified', e.target.checked)}
          />
          <span className="text-sm">Tampilkan Badge Verified</span>
        </label>
      </div>
    </div>
  );
}

export function PackagesBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as PackagesBlockContent;

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      content: { ...content, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Judul</Label>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Paket Populer"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="Subtitle (opsional)"
        />
      </div>
      <div>
        <Label>Jumlah Paket</Label>
        <Input
          type="number"
          value={content.limit || 6}
          onChange={(e) => handleChange('limit', parseInt(e.target.value))}
          min={1}
          max={20}
        />
      </div>
      <div>
        <Label>Jumlah Kolom</Label>
        <Select value={String(content.columns || 3)} onValueChange={(v) => handleChange('columns', parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Kolom</SelectItem>
            <SelectItem value="3">3 Kolom</SelectItem>
            <SelectItem value="4">4 Kolom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={content.showPrice || false}
            onChange={(e) => handleChange('showPrice', e.target.checked)}
          />
          <span className="text-sm">Tampilkan Harga</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={content.showRating || false}
            onChange={(e) => handleChange('showRating', e.target.checked)}
          />
          <span className="text-sm">Tampilkan Rating</span>
        </label>
      </div>
    </div>
  );
}

export function FAQBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as FAQBlockContent;

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      content: { ...content, [key]: value },
    });
  };

  const handleFAQChange = (idx: number, key: string, value: string) => {
    const faqs = [...content.faqs];
    faqs[idx] = { ...faqs[idx], [key]: value };
    handleChange('faqs', faqs);
  };

  const addFAQ = () => {
    handleChange('faqs', [
      ...content.faqs,
      { question: 'Pertanyaan baru?', answer: 'Jawaban Anda di sini' },
    ]);
  };

  const removeFAQ = (idx: number) => {
    handleChange('faqs', content.faqs.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Judul</Label>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Pertanyaan Umum"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="Subtitle (opsional)"
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-base font-semibold">FAQ Items</Label>
          <Button size="sm" onClick={addFAQ}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah FAQ
          </Button>
        </div>

        <div className="space-y-4">
          {content.faqs.map((faq, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-medium">FAQ {idx + 1}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFAQ(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <Label className="text-sm">Pertanyaan</Label>
                <Input
                  value={faq.question}
                  onChange={(e) => handleFAQChange(idx, 'question', e.target.value)}
                  placeholder="Pertanyaan"
                />
              </div>
              <div>
                <Label className="text-sm">Jawaban</Label>
                <Textarea
                  value={faq.answer}
                  onChange={(e) => handleFAQChange(idx, 'answer', e.target.value)}
                  placeholder="Jawaban"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContactBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as ContactBlockContent;

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      content: { ...content, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Judul</Label>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Hubungi Kami"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={content.subtitle || ''}
          onChange={(e) => handleChange('subtitle', e.target.value)}
          placeholder="Subtitle (opsional)"
        />
      </div>
      <div>
        <Label>Tipe Kontak</Label>
        <Select value={content.type} onValueChange={(v) => handleChange('type', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="form">Form Saja</SelectItem>
            <SelectItem value="whatsapp">WhatsApp Saja</SelectItem>
            <SelectItem value="both">Keduanya</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(content.type === 'whatsapp' || content.type === 'both') && (
        <>
          <div>
            <Label>Nomor WhatsApp</Label>
            <Input
              value={content.whatsappNumber || ''}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              placeholder="62812345678"
            />
          </div>
          <div>
            <Label>Pesan Default WhatsApp</Label>
            <Textarea
              value={content.whatsappMessage || ''}
              onChange={(e) => handleChange('whatsappMessage', e.target.value)}
              placeholder="Halo, saya ingin bertanya tentang paket umroh"
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function RichTextBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as RichTextBlockContent;

  const handleChange = (html: string) => {
    onChange({
      ...block,
      content: { ...content, html },
    });
  };

  return (
    <div className="space-y-4">
      <Label>Konten HTML</Label>
      <ReactQuill
        value={content.html}
        onChange={handleChange}
        theme="snow"
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
          ],
        }}
      />
    </div>
  );
}

// Main editor component dispatcher
export function BlockEditor({ block, onChange }: BlockEditorProps) {
  switch (block.type) {
    case 'hero':
      return <HeroBlockEditor block={block} onChange={onChange} />;
    case 'features':
      return <FeaturesBlockEditor block={block} onChange={onChange} />;
    case 'testimonials':
      return <TestimonialsBlockEditor block={block} onChange={onChange} />;
    case 'packages':
      return <PackagesBlockEditor block={block} onChange={onChange} />;
    case 'faq':
      return <FAQBlockEditor block={block} onChange={onChange} />;
    case 'contact':
      return <ContactBlockEditor block={block} onChange={onChange} />;
    case 'richtext':
      return <RichTextBlockEditor block={block} onChange={onChange} />;
    default:
      return <div>Unknown block type</div>;
  }
}
