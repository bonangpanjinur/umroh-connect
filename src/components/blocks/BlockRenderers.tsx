// Block renderers that generate HTML from block data

import { BlockData, HeroBlockContent, FeaturesBlockContent, TestimonialsBlockContent, PackagesBlockContent, FAQBlockContent, ContactBlockContent, RichTextBlockContent } from '@/types/blocks';

export function renderHeroBlock(block: BlockData): string {
  const content = block.content as HeroBlockContent;
  const bgColor = content.backgroundColor || '#8B5CF6';
  const textColor = content.textColor === 'dark' ? '#000' : '#fff';
  const alignment = content.alignment === 'left' ? 'text-left' : content.alignment === 'right' ? 'text-right' : 'text-center';

  return `
    <section class="relative py-24 px-4 md:py-32 overflow-hidden" style="background-color: ${bgColor}; color: ${textColor};">
      <div class="absolute inset-0 opacity-10">
        ${content.backgroundImage ? `<img src="${content.backgroundImage}" alt="Background" class="w-full h-full object-cover" />` : ''}
      </div>
      <div class="relative max-w-4xl mx-auto ${alignment}">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
          ${escapeHtml(content.title)}
        </h1>
        <p class="text-lg md:text-xl mb-8 opacity-90 max-w-2xl ${alignment === 'text-center' ? 'mx-auto' : ''}">
          ${escapeHtml(content.subtitle)}
        </p>
        ${content.ctaText ? `
          <a href="${escapeHtml(content.ctaLink || '#')}" class="inline-block px-8 py-4 rounded-lg font-bold text-lg transition-transform hover:scale-105" style="background-color: ${textColor === '#fff' ? '#000' : '#fff'}; color: ${textColor === '#fff' ? '#fff' : '#000'};">
            ${escapeHtml(content.ctaText)}
          </a>
        ` : ''}
      </div>
    </section>
  `;
}

export function renderFeaturesBlock(block: BlockData): string {
  const content = block.content as FeaturesBlockContent;
  const cols = content.columns || 3;
  const colClass = `md:grid-cols-${cols}`;

  return `
    <section class="py-16 px-4 md:py-24 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(content.title)}</h2>
          ${content.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(content.subtitle)}</p>` : ''}
        </div>
        <div class="grid grid-cols-1 ${colClass} gap-8">
          ${content.features.map(feature => `
            <div class="p-8 border rounded-xl hover:shadow-xl transition-shadow text-center">
              <div class="text-4xl mb-4">${feature.icon}</div>
              <h3 class="text-xl font-bold mb-2">${escapeHtml(feature.title)}</h3>
              <p class="text-gray-600">${escapeHtml(feature.description)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export function renderTestimonialsBlock(block: BlockData): string {
  const content = block.content as TestimonialsBlockContent;

  return `
    <section class="py-16 px-4 md:py-24 bg-gray-50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(content.title)}</h2>
          ${content.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(content.subtitle)}</p>` : ''}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Testimonials will be dynamically loaded from database -->
          <div class="p-6 bg-white rounded-lg shadow">
            <div class="flex items-center gap-2 mb-4">
              ${content.showRating ? '<div class="text-yellow-400">★★★★★</div>' : ''}
              ${content.showVerified ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified</span>' : ''}
            </div>
            <p class="text-gray-600 mb-4">"Pengalaman yang luar biasa, pelayanan sangat memuaskan."</p>
            <p class="font-semibold">Nama Jamaah</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderPackagesBlock(block: BlockData): string {
  const content = block.content as PackagesBlockContent;
  const cols = content.columns || 3;
  const colClass = `md:grid-cols-${cols}`;

  return `
    <section class="py-16 px-4 md:py-24 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(content.title)}</h2>
          ${content.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(content.subtitle)}</p>` : ''}
        </div>
        <div class="grid grid-cols-1 ${colClass} gap-8">
          <!-- Packages will be dynamically loaded from database -->
          <div class="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div class="aspect-video bg-gray-200 flex items-center justify-center">
              <span class="text-gray-400">Package Image</span>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold mb-2">Paket Umroh</h3>
              <p class="text-gray-600 mb-4">Deskripsi paket umroh Anda</p>
              ${content.showPrice ? '<p class="text-2xl font-bold text-primary mb-4">Rp 15.000.000</p>' : ''}
              ${content.showRating ? '<div class="text-yellow-400 mb-4">★★★★★ (50 reviews)</div>' : ''}
              <button class="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90">Lihat Detail</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderFAQBlock(block: BlockData): string {
  const content = block.content as FAQBlockContent;

  return `
    <section class="py-16 px-4 md:py-24 bg-gray-50">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(content.title)}</h2>
          ${content.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(content.subtitle)}</p>` : ''}
        </div>
        <div class="space-y-4">
          ${content.faqs.map((faq, idx) => `
            <details class="group border rounded-lg p-4 cursor-pointer hover:bg-white transition-colors">
              <summary class="font-semibold flex items-center justify-between">
                ${escapeHtml(faq.question)}
                <span class="text-xl group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="mt-4 text-gray-600">${escapeHtml(faq.answer)}</p>
            </details>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export function renderContactBlock(block: BlockData): string {
  const content = block.content as ContactBlockContent;

  return `
    <section class="py-16 px-4 md:py-24 bg-white">
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(content.title)}</h2>
          ${content.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(content.subtitle)}</p>` : ''}
        </div>
        
        ${content.type === 'whatsapp' || content.type === 'both' ? `
          <div class="mb-8 text-center">
            <a href="https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent(content.whatsappMessage || '')}" 
               class="inline-block px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors">
              💬 Chat via WhatsApp
            </a>
          </div>
        ` : ''}

        ${content.type === 'form' || content.type === 'both' ? `
          <form class="space-y-4">
            ${content.formFields?.map(field => `
              <div>
                <label class="block text-sm font-medium mb-2">${escapeHtml(field.label)}</label>
                ${field.type === 'textarea' ? 
                  `<textarea name="${field.name}" rows="4" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" ${field.required ? 'required' : ''}></textarea>` :
                  `<input type="${field.type}" name="${field.name}" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" ${field.required ? 'required' : ''} />`
                }
              </div>
            `).join('')}
            <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Kirim Pesan
            </button>
          </form>
        ` : ''}
      </div>
    </section>
  `;
}

export function renderRichTextBlock(block: BlockData): string {
  const content = block.content as RichTextBlockContent;
  return `
    <section class="py-16 px-4 md:py-24 bg-white">
      <div class="max-w-4xl mx-auto prose prose-lg dark:prose-invert max-w-none">
        ${content.html}
      </div>
    </section>
  `;
}

// Main renderer function
export function renderBlock(block: BlockData): string {
  switch (block.type) {
    case 'hero':
      return renderHeroBlock(block);
    case 'features':
      return renderFeaturesBlock(block);
    case 'testimonials':
      return renderTestimonialsBlock(block);
    case 'packages':
      return renderPackagesBlock(block);
    case 'faq':
      return renderFAQBlock(block);
    case 'contact':
      return renderContactBlock(block);
    case 'richtext':
      return renderRichTextBlock(block);
    default:
      return '';
  }
}

// Generate complete HTML from blocks
export function generatePageHTML(blocks: BlockData[], title: string, metaDescription: string): string {
  const blocksHTML = blocks.map(renderBlock).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <title>${escapeHtml(title)} | Arah Umroh</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: #8B5CF6;
    }
    .bg-primary { background-color: var(--primary); }
    .text-primary { color: var(--primary); }
    .border-primary { border-color: var(--primary); }
    .focus\\:ring-primary:focus { --tw-ring-color: var(--primary); }
  </style>
</head>
<body class="bg-white text-gray-900">
  ${blocksHTML}
  
  <footer class="bg-gray-900 text-white py-8 px-4">
    <div class="max-w-6xl mx-auto text-center">
      <p>&copy; ${new Date().getFullYear()} Arah Umroh. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;
}

// Utility function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
