import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertCircle, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface PageHtmlEditorProps {
  html: string;
  css: string;
  onHtmlChange: (html: string) => void;
  onCssChange: (css: string) => void;
}

const HTML_TEMPLATES = {
  blank: {
    name: 'Blank',
    html: '<div class="container">\n  <h1>Judul Halaman</h1>\n  <p>Konten halaman Anda di sini</p>\n</div>',
    css: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 40px 20px;\n}\n\nh1 {\n  font-size: 2.5rem;\n  margin-bottom: 20px;\n  color: #333;\n}\n\np {\n  font-size: 1rem;\n  line-height: 1.6;\n  color: #666;\n}',
  },
  hero: {
    name: 'Hero Section',
    html: '<section class="hero">\n  <div class="hero-content">\n    <h1>Selamat Datang</h1>\n    <p>Deskripsi singkat tentang layanan Anda</p>\n    <button class="cta-button">Mulai Sekarang</button>\n  </div>\n</section>',
    css: '.hero {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  padding: 100px 20px;\n  text-align: center;\n  min-height: 500px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.hero-content h1 {\n  font-size: 3rem;\n  margin-bottom: 20px;\n  font-weight: bold;\n}\n\n.hero-content p {\n  font-size: 1.2rem;\n  margin-bottom: 30px;\n  opacity: 0.9;\n}\n\n.cta-button {\n  background-color: white;\n  color: #667eea;\n  padding: 12px 30px;\n  border: none;\n  border-radius: 5px;\n  font-size: 1rem;\n  font-weight: bold;\n  cursor: pointer;\n  transition: transform 0.3s ease;\n}\n\n.cta-button:hover {\n  transform: scale(1.05);\n}',
  },
  twoColumn: {
    name: 'Two Column',
    html: '<div class="container">\n  <div class="row">\n    <div class="column">\n      <h2>Kolom 1</h2>\n      <p>Konten untuk kolom pertama</p>\n    </div>\n    <div class="column">\n      <h2>Kolom 2</h2>\n      <p>Konten untuk kolom kedua</p>\n    </div>\n  </div>\n</div>',
    css: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 40px 20px;\n}\n\n.row {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 30px;\n}\n\n.column {\n  padding: 20px;\n  background: #f5f5f5;\n  border-radius: 8px;\n}\n\n.column h2 {\n  font-size: 1.5rem;\n  margin-bottom: 15px;\n  color: #333;\n}\n\n.column p {\n  color: #666;\n  line-height: 1.6;\n}\n\n@media (max-width: 768px) {\n  .row {\n    grid-template-columns: 1fr;\n  }\n}',
  },
  features: {
    name: 'Features Grid',
    html: '<div class="container">\n  <h2 class="section-title">Fitur Kami</h2>\n  <div class="features-grid">\n    <div class="feature-card">\n      <div class="feature-icon">🚀</div>\n      <h3>Cepat</h3>\n      <p>Performa tinggi dan responsif</p>\n    </div>\n    <div class="feature-card">\n      <div class="feature-icon">🔒</div>\n      <h3>Aman</h3>\n      <p>Keamanan tingkat enterprise</p>\n    </div>\n    <div class="feature-card">\n      <div class="feature-icon">💡</div>\n      <h3>Inovatif</h3>\n      <p>Teknologi terdepan</p>\n    </div>\n  </div>\n</div>',
    css: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 60px 20px;\n}\n\n.section-title {\n  text-align: center;\n  font-size: 2rem;\n  margin-bottom: 50px;\n  color: #333;\n}\n\n.features-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 30px;\n}\n\n.feature-card {\n  background: white;\n  border: 1px solid #e0e0e0;\n  border-radius: 8px;\n  padding: 30px;\n  text-align: center;\n  transition: transform 0.3s ease, box-shadow 0.3s ease;\n}\n\n.feature-card:hover {\n  transform: translateY(-5px);\n  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);\n}\n\n.feature-icon {\n  font-size: 3rem;\n  margin-bottom: 15px;\n}\n\n.feature-card h3 {\n  font-size: 1.3rem;\n  margin-bottom: 10px;\n  color: #333;\n}\n\n.feature-card p {\n  color: #666;\n  line-height: 1.6;\n}',
  },
};

export const PageHtmlEditor = ({
  html,
  css,
  onHtmlChange,
  onCssChange,
}: PageHtmlEditorProps) => {
  const [showPreview, setShowPreview] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const applyTemplate = (templateKey: string) => {
    const template = HTML_TEMPLATES[templateKey as keyof typeof HTML_TEMPLATES];
    if (template) {
      onHtmlChange(template.html);
      onCssChange(template.css);
      setSelectedTemplate(templateKey);
      toast.success('Template berhasil diterapkan');
    }
  };

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${label} disalin ke clipboard`);
  };

  const downloadCode = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halaman Custom</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml));
    element.setAttribute('download', 'page.html');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('File HTML berhasil diunduh');
  };

  return (
    <div className="space-y-4">
      {/* Templates */}
      <div className="space-y-2">
        <Label>Template Starter</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="css">CSS</TabsTrigger>
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
              Gunakan class CSS untuk styling. Hindari inline styles untuk hasil yang lebih baik.
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
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              CSS akan diterapkan ke seluruh halaman. Gunakan class selectors untuk styling yang lebih spesifik.
            </p>
          </div>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Preview Halaman</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Tampilkan
                  </>
                )}
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
            <Card className="overflow-hidden border-2">
              <div className="bg-white p-4">
                <iframe
                  srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f5f5f5;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`}
                  style={{
                    width: '100%',
                    height: '500px',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                  title="Page Preview"
                  sandbox={{
                    allow: ['same-origin'],
                  } as any}
                />
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
