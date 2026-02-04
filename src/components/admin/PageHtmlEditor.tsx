import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertCircle, Copy, Download, Eye, EyeOff, Code2 } from 'lucide-react';
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
    html: '<div class="container">\n  <h1>Judul Halaman</h1>\n  <p>Konten halaman Anda di sini</p>\n</div>',
    css: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 40px 20px;\n}\n\nh1 {\n  font-size: 2.5rem;\n  margin-bottom: 20px;\n  color: #333;\n}\n\np {\n  font-size: 1rem;\n  line-height: 1.6;\n  color: #666;\n}',
    javascript: '// Tulis JavaScript Anda di sini\nconsole.log("Halaman dimuat");',
  },
  hero: {
    name: 'Hero Section',
    html: '<section class="hero">\n  <div class="hero-content">\n    <h1>Selamat Datang</h1>\n    <p>Deskripsi singkat tentang layanan Anda</p>\n    <button class="cta-button" onclick="handleClick()">Mulai Sekarang</button>\n  </div>\n</section>',
    css: '.hero {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  padding: 100px 20px;\n  text-align: center;\n  min-height: 500px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.hero-content h1 {\n  font-size: 3rem;\n  margin-bottom: 20px;\n  font-weight: bold;\n}\n\n.hero-content p {\n  font-size: 1.2rem;\n  margin-bottom: 30px;\n  opacity: 0.9;\n}\n\n.cta-button {\n  background-color: white;\n  color: #667eea;\n  padding: 12px 30px;\n  border: none;\n  border-radius: 5px;\n  font-size: 1rem;\n  font-weight: bold;\n  cursor: pointer;\n  transition: transform 0.3s ease;\n}\n\n.cta-button:hover {\n  transform: scale(1.05);\n}',
    javascript: 'function handleClick() {\n  alert("Terima kasih telah mengklik tombol!");\n  console.log("Tombol diklik");\n}',
  },
  twoColumn: {
    name: 'Two Column',
    html: '<div class="container">\n  <div class="row">\n    <div class="column">\n      <h2>Kolom 1</h2>\n      <p>Konten untuk kolom pertama</p>\n    </div>\n    <div class="column">\n      <h2>Kolom 2</h2>\n      <p>Konten untuk kolom kedua</p>\n    </div>\n  </div>\n</div>',
    css: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 40px 20px;\n}\n\n.row {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 30px;\n}\n\n.column {\n  padding: 20px;\n  background: #f5f5f5;\n  border-radius: 8px;\n}\n\n.column h2 {\n  font-size: 1.5rem;\n  margin-bottom: 15px;\n  color: #333;\n}\n\n.column p {\n  color: #666;\n  line-height: 1.6;\n}\n\n@media (max-width: 768px) {\n  .row {\n    grid-template-columns: 1fr;\n  }\n}',
    javascript: 'console.log("Two column layout loaded");',
  },
  features: {
    name: 'Features Grid',
    html: '<div class="container">\n  <h2 class="section-title">Fitur Kami</h2>\n  <div class="features-grid">\n    <div class="feature-card">\n      <div class="feature-icon">🚀</div>\n      <h3>Cepat</h3>\n      <p>Performa tinggi dan responsif</p>\n    </div>\n    <div class="feature-card">\n      <div class="feature-icon">🔒</div>\n      <h3>Aman</h3>\n      <p>Keamanan tingkat enterprise</p>\n    </div>\n    <div class="feature-card">\n      <div class="feature-icon">💡</div>\n      <h3>Inovatif</h3>\n      <p>Teknologi terdepan</p>\n    </div>\n  </div>\n</div>',
    css: '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 60px 20px;\n}\n\n.section-title {\n  text-align: center;\n  font-size: 2rem;\n  margin-bottom: 50px;\n  color: #333;\n}\n\n.features-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 30px;\n}\n\n.feature-card {\n  background: white;\n  border: 1px solid #e0e0e0;\n  border-radius: 8px;\n  padding: 30px;\n  text-align: center;\n  transition: transform 0.3s ease, box-shadow 0.3s ease;\n}\n\n.feature-card:hover {\n  transform: translateY(-5px);\n  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);\n}\n\n.feature-icon {\n  font-size: 3rem;\n  margin-bottom: 15px;\n}\n\n.feature-card h3 {\n  font-size: 1.3rem;\n  margin-bottom: 10px;\n  color: #333;\n}\n\n.feature-card p {\n  color: #666;\n  line-height: 1.6;\n}',
    javascript: 'document.querySelectorAll(".feature-card").forEach((card) => {\n  card.addEventListener("click", function() {\n    console.log("Card clicked:", this.querySelector("h3").textContent);\n  });\n});',
  },
  interactive: {
    name: 'Interactive Form',
    html: '<div class="container">\n  <div class="form-wrapper">\n    <h2>Formulir Interaktif</h2>\n    <form id="contactForm">\n      <div class="form-group">\n        <label for="name">Nama:</label>\n        <input type="text" id="name" name="name" required>\n      </div>\n      <div class="form-group">\n        <label for="email">Email:</label>\n        <input type="email" id="email" name="email" required>\n      </div>\n      <div class="form-group">\n        <label for="message">Pesan:</label>\n        <textarea id="message" name="message" rows="5" required></textarea>\n      </div>\n      <button type="submit" class="submit-btn">Kirim</button>\n    </form>\n    <div id="successMessage" class="hidden">Pesan berhasil dikirim!</div>\n  </div>\n</div>',
    css: '.container {\n  max-width: 600px;\n  margin: 0 auto;\n  padding: 40px 20px;\n}\n\n.form-wrapper {\n  background: white;\n  border-radius: 8px;\n  padding: 30px;\n  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n}\n\n.form-wrapper h2 {\n  margin-bottom: 20px;\n  color: #333;\n}\n\n.form-group {\n  margin-bottom: 20px;\n}\n\n.form-group label {\n  display: block;\n  margin-bottom: 8px;\n  font-weight: 500;\n  color: #333;\n}\n\n.form-group input,\n.form-group textarea {\n  width: 100%;\n  padding: 10px;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  font-size: 1rem;\n  font-family: inherit;\n}\n\n.form-group input:focus,\n.form-group textarea:focus {\n  outline: none;\n  border-color: #667eea;\n  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);\n}\n\n.submit-btn {\n  background-color: #667eea;\n  color: white;\n  padding: 12px 30px;\n  border: none;\n  border-radius: 4px;\n  font-size: 1rem;\n  font-weight: bold;\n  cursor: pointer;\n  transition: background-color 0.3s ease;\n}\n\n.submit-btn:hover {\n  background-color: #5568d3;\n}\n\n.hidden {\n  display: none;\n}\n\n.success {\n  display: block;\n  color: #22863a;\n  background-color: #f0f8f4;\n  padding: 12px;\n  border-radius: 4px;\n  margin-top: 20px;\n}',
    javascript: 'document.getElementById("contactForm").addEventListener("submit", function(e) {\n  e.preventDefault();\n  const name = document.getElementById("name").value;\n  const email = document.getElementById("email").value;\n  const message = document.getElementById("message").value;\n  \n  console.log("Form submitted:", { name, email, message });\n  \n  // Reset form\n  this.reset();\n  \n  // Show success message\n  const successMsg = document.getElementById("successMessage");\n  successMsg.classList.remove("hidden");\n  successMsg.classList.add("success");\n  \n  // Hide after 3 seconds\n  setTimeout(() => {\n    successMsg.classList.add("hidden");\n    successMsg.classList.remove("success");\n  }, 3000);\n});',
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

  const applyTemplate = (templateKey: string) => {
    const template = HTML_TEMPLATES[templateKey as keyof typeof HTML_TEMPLATES];
    if (template) {
      onHtmlChange(template.html);
      onCssChange(template.css);
      onJavaScriptChange(template.javascript);
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
<script>
${javascript}
</script>
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
              Gunakan class CSS untuk styling. Anda dapat menambahkan event handler seperti onclick, onchange, dll.
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
          <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
            <Code2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-700">
              <p className="font-medium mb-1">Tips JavaScript:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Gunakan <code className="bg-purple-100 px-1 rounded">document.getElementById()</code> untuk akses elemen</li>
                <li>Gunakan <code className="bg-purple-100 px-1 rounded">addEventListener()</code> untuk event handling</li>
                <li>Hindari <code className="bg-purple-100 px-1 rounded">eval()</code> dan kode berbahaya</li>
              </ul>
            </div>
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
  <script>
    ${javascript}
  </script>
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
