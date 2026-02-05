// Block editor components for editing individual blocks

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  BlockData, 
  HeroBlockContent, 
  FeaturesBlockContent, 
  TestimonialsBlockContent, 
  PackagesBlockContent, 
  FAQBlockContent, 
  ContactBlockContent, 
  RichTextBlockContent,
  GalleryBlockContent,
  VideoBlockContent
} from '@/types/blocks';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Trash2, Plus, Image as ImageIcon, Video as VideoIcon, Settings, Sparkles } from 'lucide-react';
import { AIContentAssistant } from './AIContentAssistant';

interface BlockEditorProps {
  block: BlockData;
  onChange: (block: BlockData) => void;
}

export function AdvancedSettingsEditor({ block, onChange }: BlockEditorProps) {
  const settings = block.settings || {
    paddingTop: 'py-16',
    paddingBottom: 'py-16',
    backgroundColor: '',
    customClass: '',
    isVisible: true,
  };

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      settings: { ...settings, [key]: value },
    });
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="isVisible">Tampilkan Blok</Label>
        <Switch
          id="isVisible"
          checked={settings.isVisible !== false}
          onCheckedChange={(checked) => handleChange('isVisible', checked)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Padding Atas</Label>
          <Select value={settings.paddingTop || 'py-16'} onValueChange={(v) => handleChange('paddingTop', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="py-0">None</SelectItem>
              <SelectItem value="py-8">Small</SelectItem>
              <SelectItem value="py-16">Medium</SelectItem>
              <SelectItem value="py-24">Large</SelectItem>
              <SelectItem value="py-32">XL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Padding Bawah</Label>
          <Select value={settings.paddingBottom || 'py-16'} onValueChange={(v) => handleChange('paddingBottom', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="py-0">None</SelectItem>
              <SelectItem value="py-8">Small</SelectItem>
              <SelectItem value="py-16">Medium</SelectItem>
              <SelectItem value="py-24">Large</SelectItem>
              <SelectItem value="py-32">XL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Warna Latar Belakang (Hex)</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <Input
            value={settings.backgroundColor || ''}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label>Custom CSS Class</Label>
        <Input
          value={settings.customClass || ''}
          onChange={(e) => handleChange('customClass', e.target.value)}
          placeholder="my-custom-class"
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <Label className="text-base font-semibold mb-2 block">Animasi Masuk (AOS)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Tipe Animasi</Label>
            <Select 
              value={settings.animation || 'none'} 
              onValueChange={(v) => handleChange('animation', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Animasi</SelectItem>
                <SelectItem value="fade-up">Fade Up</SelectItem>
                <SelectItem value="fade-down">Fade Down</SelectItem>
                <SelectItem value="fade-left">Fade Left</SelectItem>
                <SelectItem value="fade-right">Fade Right</SelectItem>
                <SelectItem value="zoom-in">Zoom In</SelectItem>
                <SelectItem value="zoom-out">Zoom Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Durasi (ms)</Label>
            <Input 
              type="number"
              value={settings.animationDuration || 1000}
              onChange={(e) => handleChange('animationDuration', parseInt(e.target.value))}
              step={100}
              min={0}
              max={3000}
            />
          </div>
        </div>
      </div>
    </div>
  );
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
        <div className="flex items-center justify-between mb-2">
          <Label>Judul</Label>
          <AIContentAssistant 
            label="Judul Hero"
            currentValue={content.title}
            onApply={(val) => handleChange('title', val)}
            context="Ini adalah judul utama di bagian paling atas halaman travel umroh."
          />
        </div>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Masukkan judul hero section"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Subtitle</Label>
          <AIContentAssistant 
            label="Subtitle Hero"
            currentValue={content.subtitle}
            onApply={(val) => handleChange('subtitle', val)}
            context={`Judulnya adalah: ${content.title}. Buatkan subtitle yang mendukung.`}
          />
        </div>
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
      { question: 'Pertanyaan baru?', answer: 'Jawaban Anda di sini.' },
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
          <Label className="text-base font-semibold">Daftar FAQ</Label>
          <Button size="sm" onClick={addFAQ}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah FAQ
          </Button>
        </div>

        <div className="space-y-4">
          {content.faqs.map((faq, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">FAQ {idx + 1}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFAQ(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">Pertanyaan</Label>
                <Input
                  value={faq.question}
                  onChange={(e) => handleFAQChange(idx, 'question', e.target.value)}
                  placeholder="Masukkan pertanyaan"
                />
              </div>
              <div>
                <Label className="text-xs">Jawaban</Label>
                <Textarea
                  value={faq.answer}
                  onChange={(e) => handleFAQChange(idx, 'answer', e.target.value)}
                  placeholder="Masukkan jawaban"
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
            <SelectItem value="form">Formulir Kontak</SelectItem>
            <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
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

export function GalleryBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as GalleryBlockContent;

  const handleChange = (key: string, value: any) => {
    onChange({
      ...block,
      content: { ...content, [key]: value },
    });
  };

  const handleImageChange = (idx: number, key: string, value: string) => {
    const images = [...content.images];
    images[idx] = { ...images[idx], [key]: value };
    handleChange('images', images);
  };

  const addImage = () => {
    handleChange('images', [
      ...content.images,
      { url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa', caption: 'Masjidil Haram' },
    ]);
  };

  const removeImage = (idx: number) => {
    handleChange('images', content.images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Judul</Label>
        <Input
          value={content.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Galeri Kami"
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
          <Label className="text-base font-semibold">Daftar Gambar</Label>
          <Button size="sm" onClick={addImage}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Gambar
          </Button>
        </div>

        <div className="space-y-4">
          {content.images.map((img, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">Gambar {idx + 1}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">URL Gambar</Label>
                <Input
                  value={img.url}
                  onChange={(e) => handleImageChange(idx, 'url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-xs">Caption</Label>
                <Input
                  value={img.caption || ''}
                  onChange={(e) => handleImageChange(idx, 'caption', e.target.value)}
                  placeholder="Keterangan gambar"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VideoBlockEditor({ block, onChange }: BlockEditorProps) {
  const content = block.content as VideoBlockContent;

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
          placeholder="Video Perjalanan"
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
        <Label>Platform</Label>
        <Select value={content.platform} onValueChange={(v) => handleChange('platform', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>URL Video</Label>
        <Input
          value={content.videoUrl}
          onChange={(e) => handleChange('videoUrl', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={content.autoplay || false}
            onChange={(e) => handleChange('autoplay', e.target.checked)}
          />
          <span className="text-sm">Autoplay</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={content.loop || false}
            onChange={(e) => handleChange('loop', e.target.checked)}
          />
          <span className="text-sm">Loop</span>
        </label>
      </div>
    </div>
  );
}

// Main editor component dispatcher
export function BlockEditor({ block, onChange }: BlockEditorProps) {
  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="content" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Konten
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Pengaturan
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="mt-0">
        {(() => {
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
            case 'gallery':
              return <GalleryBlockEditor block={block} onChange={onChange} />;
            case 'video':
              return <VideoBlockEditor block={block} onChange={onChange} />;
            default:
              return <div>Unknown block type</div>;
          }
        })()}
      </TabsContent>
      
      <TabsContent value="settings" className="mt-0">
        <AdvancedSettingsEditor block={block} onChange={onChange} />
      </TabsContent>
    </Tabs>
  );
}
