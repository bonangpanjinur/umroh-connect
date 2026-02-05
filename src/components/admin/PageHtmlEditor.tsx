import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertCircle, Copy, Download, Eye, EyeOff, Code2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PageHtmlEditorProps {
  html: string;
  css: string;
  javascript: string;
  onHtmlChange: (html: string) => void;
  onCssChange: (css: string) => void;
  onJavaScriptChange: (js: string) => void;
}

const HTML_TEMPLATES = {
  blank: {
    name: 'Blank',
    html: '<div class="container mx-auto p-8">\n  <h1 class="text-4xl font-bold mb-4">Judul Halaman</h1>\n  <p class="text-lg text-gray-600">Konten halaman Anda di sini</p>\n</div>',
    css: '/* Custom CSS */\n.container {\n  max-width: 1200px;\n}',
    javascript: '// Tulis JavaScript Anda di sini\nconsole.log("Halaman dimuat");',
  },
  hero: {
    name: 'Hero Section',
    html: '<section class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24 px-4 min-h-[500px] flex items-center justify-center text-center">\n  <div class="max-w-3xl">\n    <h1 class="text-5xl font-extrabold mb-6">Selamat Datang di Umroh Connect</h1>\n    <p class="text-xl mb-8 opacity-90">Perjalanan spiritual yang nyaman dan terpercaya untuk Anda dan keluarga.</p>\n    <button class="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform" onclick="handleClick()">Daftar Sekarang</button>\n  </div>\n</section>',
    css: '/* Hero styles */\n.hero-animate {\n  animation: fadeIn 1s ease-out;\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(20px); }\n  to { opacity: 1; transform: translateY(0); }\n}',
    javascript: 'function handleClick() {\n  alert("Terima kasih telah mengklik tombol!");\n  console.log("Tombol diklik");\n}',
  },
  twoColumn: {
    name: 'Two Column',
    html: '<div class="container mx-auto px-4 py-16">\n  <div class="grid md:grid-cols-2 gap-12 items-center">\n    <div>\n      <h2 class="text-3xl font-bold mb-4">Layanan Kami</h2>\n      <p class="text-gray-600 leading-relaxed mb-6">Kami menyediakan berbagai paket umroh yang dapat disesuaikan dengan kebutuhan dan anggaran Anda. Dengan pengalaman bertahun-tahun, kami menjamin kepuasan jamaah.</p>\n      <ul class="space-y-2">\n        <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Pembimbing Berpengalaman</li>\n        <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Akomodasi Bintang 5</li>\n        <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Transportasi Nyaman</li>\n      </ul>\n    </div>\n    <div class="bg-gray-100 rounded-2xl aspect-video flex items-center justify-center text-gray-400 font-medium">Gambar/Video Placeholder</div>\n  </div>\n</div>',
    css: '',
    javascript: 'console.log("Two column layout loaded");',
  },
  features: {
    name: 'Features Grid',
    html: '<div class="container mx-auto px-4 py-20">\n  <h2 class="text-3xl font-bold text-center mb-16">Mengapa Memilih Kami?</h2>\n  <div class="grid md:grid-cols-3 gap-8">\n    <div class="p-8 border rounded-xl hover:shadow-xl transition-shadow text-center feature-card">\n      <div class="text-4xl mb-4">🚀</div>\n      <h3 class="text-xl font-bold mb-2">Cepat</h3>\n      <p class="text-gray-600">Proses pendaftaran dan administrasi yang cepat dan mudah.</p>\n    </div>\n    <div class="p-8 border rounded-xl hover:shadow-xl transition-shadow text-center feature-card">\n      <div class="text-4xl mb-4">🔒</div>\n      <h3 class="text-xl font-bold mb-2">Aman</h3>\n      <p class="text-gray-600">Keamanan transaksi dan data jamaah adalah prioritas utama kami.</p>\n    </div>\n    <div class="p-8 border rounded-xl hover:shadow-xl transition-shadow text-center feature-card">\n      <div class="text-4xl mb-4">💡</div>\n      <h3 class="text-xl font-bold mb-2">Inovatif</h3>\n      <p class="text-gray-600">Pemanfaatan teknologi untuk memudahkan ibadah Anda.</p>\n    </div>\n  </div>\n</div>',
    css: '',
    javascript: 'document.querySelectorAll(".feature-card").forEach((card) => {\n  card.addEventListener("click", function() {\n    console.log("Card clicked:", this.querySelector("h3").textContent);\n  });\n});',
  },
  interactive: {
    name: 'Interactive Form',
    html: '<div class="max-w-lg mx-auto px-4 py-16">\n  <div class="bg-white rounded-2xl shadow-2xl p-8 border">\n    <h2 class="text-2xl font-bold mb-6 text-center">Hubungi Kami</h2>\n    <form id="contactForm" class="space-y-4">\n      <div>\n        <label class="block text-sm font-medium mb-1">Nama Lengkap</label>\n        <input type="text" id="name" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>\n      </div>\n      <div>\n        <label class="block text-sm font-medium mb-1">Email</label>\n        <input type="email" id="email" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>\n      </div>\n      <div>\n        <label class="block text-sm font-medium mb-1">Pesan</label>\n        <textarea id="message" rows="4" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required></textarea>\n      </div>\n      <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Kirim Pesan</button>\n    </form>\n    <div id="successMessage" class="hidden mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-center font-medium">Pesan berhasil dikirim!</div>\n  </div>\n</div>',
    css: '',
    javascript: 'document.getElementById("contactForm").addEventListener("submit", function(e) {\n  e.preventDefault();\n  const name = document.getElementById("name").value;\n  console.log("Form submitted by:", name);\n  \n  this.reset();\n  const successMsg = document.getElementById("successMessage");\n  successMsg.classList.remove("hidden");\n  \n  setTimeout(() => {\n    successMsg.classList.add("hidden");\n  }, 3000);\n});',
  },
};

export const PageHtmlEditor = ({
  html,
  css,
  javascript,
  onHtmlChange,
  onCssChange,
  onJavaScriptChange,
}: PageHtmlEditorProps) => {
  const [showPreview, setShowPreview] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const applyTemplate = (templateKey: string) => {
    const template = HTML_TEMPLATES[templateKey as keyof typeof HTML_TEMPLATES];
    if (template) {
      onHtmlChange(template.html);
      onCssChange(template.css);
      onJavaScriptChange(template.javascript);
      setSelectedTemplate(templateKey);
      setPreviewKey(prev => prev + 1);
      toast.success('Template berhasil diterapkan');
    }
  };

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${label} disalin ke clipboard`);
  };

  const generateFullHtml = () => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Halaman</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${css}
  </style>
</head>
<body class="bg-white min-h-screen">
  ${html}
  <script>
    try {
      ${javascript}
    } catch (e) {
      console.error("Preview JS Error:", e);
    }
  </script>
</body>
</html>`;
  };

  const downloadCode = () => {
    const fullHtml = generateFullHtml();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml));
    element.setAttribute('download', 'page.html');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('File HTML berhasil diunduh');
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Templates */}
      <div className="space-y-2">
        <Label>Template Starter</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(HTML_TEMPLATES).map(([key, template]) => (
            <Button
              key={key}
              variant={selectedTemplate === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyTemplate(key)}
              className="text-xs"
            >
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="html" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="css">CSS</TabsTrigger>
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* HTML Editor */}
        <TabsContent value="html" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Kode HTML</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyCode(html, 'HTML')}
              className="gap-1"
            >
              <Copy className="h-4 w-4" />
              Salin
            </Button>
          </div>
          <Textarea
            value={html}
            onChange={(e) => onHtmlChange(e.target.value)}
            placeholder="Masukkan kode HTML di sini..."
            className="font-mono text-sm min-h-64"
          />
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Gunakan class Tailwind CSS untuk styling cepat. Anda juga dapat menambahkan class kustom.
            </p>
          </div>
        </TabsContent>

        {/* CSS Editor */}
        <TabsContent value="css" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Kode CSS</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyCode(css, 'CSS')}
              className="gap-1"
            >
              <Copy className="h-4 w-4" />
              Salin
            </Button>
          </div>
          <Textarea
            value={css}
            onChange={(e) => onCssChange(e.target.value)}
            placeholder="Masukkan kode CSS di sini..."
            className="font-mono text-sm min-h-64"
          />
        </TabsContent>

        {/* JavaScript Editor */}
        <TabsContent value="javascript" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Kode JavaScript</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyCode(javascript, 'JavaScript')}
              className="gap-1"
            >
              <Copy className="h-4 w-4" />
              Salin
            </Button>
          </div>
          <Textarea
            value={javascript}
            onChange={(e) => onJavaScriptChange(e.target.value)}
            placeholder="Masukkan kode JavaScript di sini..."
            className="font-mono text-sm min-h-64"
          />
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Preview Halaman</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPreview}
                className="gap-1"
                title="Refresh Preview"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Sembunyikan' : 'Tampilkan'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadCode}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Unduh
              </Button>
            </div>
          </div>
          {showPreview && (
            <Card className="overflow-hidden border-2 min-h-[500px] bg-white">
              <iframe
                key={previewKey}
                ref={iframeRef}
                srcDoc={generateFullHtml()}
                style={{
                  width: '100%',
                  height: '500px',
                  border: 'none',
                }}
                title="Page Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
