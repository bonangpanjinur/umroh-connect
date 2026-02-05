// Block renderers that generate HTML from block data

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
  VideoBlockContent,
  DesignSettings,
  DEFAULT_DESIGN_SETTINGS
} from '@/types/blocks';

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

export function renderGalleryBlock(block: BlockData): string {
  const content = block.content as GalleryBlockContent;
  const cols = content.columns || 3;
  const colClass = `grid-cols-2 md:grid-cols-${cols}`;

  return `
    <section class="py-16 px-4 md:py-24 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(content.title)}</h2>
          ${content.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(content.subtitle)}</p>` : ''}
        </div>
        <div class="grid ${colClass} gap-4">
          ${content.images.map(img => `
            <div class="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
              <img src="${img.url}" alt="${escapeHtml(img.caption || '')}" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ${img.caption ? `
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p class="text-white text-sm font-medium">${escapeHtml(img.caption)}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export function renderVideoBlock(block: BlockData): string {
  const content = block.content as VideoBlockContent;
  let embedUrl = '';
  
  if (content.platform === 'youtube') {
    const videoId = content.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/)?.[1];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${content.autoplay ? 1 : 0}&loop=${content.loop ? 1 : 0}${content.loop ? `&playlist=${videoId}` : ''}`;
  } else {
    const videoId = content.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
    embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${content.autoplay ? 1 : 0}&loop=${content.loop ? 1 : 0}`;
  }

  return `
    <section class="py-16 px-4 md:py-24 bg-white">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">${escapeHtml(content.title)}</h2>
          ${content.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(content.subtitle)}</p>` : ''}
        </div>
        <div class="aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
          <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>
    </section>
  `;
}

// Main renderer function
export function renderBlock(block: BlockData): string {
  if (block.settings?.isVisible === false) return '';

  let html = '';
  switch (block.type) {
    case 'hero':
      html = renderHeroBlock(block);
      break;
    case 'features':
      html = renderFeaturesBlock(block);
      break;
    case 'testimonials':
      html = renderTestimonialsBlock(block);
      break;
    case 'packages':
      html = renderPackagesBlock(block);
      break;
    case 'faq':
      html = renderFAQBlock(block);
      break;
    case 'contact':
      html = renderContactBlock(block);
      break;
    case 'richtext':
      html = renderRichTextBlock(block);
      break;
    case 'gallery':
      html = renderGalleryBlock(block);
      break;
    case 'video':
      html = renderVideoBlock(block);
      break;
    default:
      html = '';
  }

  const s = block.settings;
  if (s) {
    const paddingClasses = `${s.paddingTop || 'py-16'} ${s.paddingBottom || 'py-16'}`;
    const bgStyle = s.backgroundColor ? `background-color: ${s.backgroundColor};` : '';
    
    // We need to strip the original section wrapper's padding if we apply it to the outer div
    // But for simplicity, we wrap the rendered HTML
    return `
      <div class="${paddingClasses} ${s.customClass || ''}" style="${bgStyle}">
        ${html}
      </div>
    `;
  }

  return html;
}

// Generate complete HTML from blocks
export function generatePageHTML(
  blocks: BlockData[], 
  title: string, 
  metaDescription: string, 
  design: DesignSettings = DEFAULT_DESIGN_SETTINGS
): string {
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
      --primary: ${design.primaryColor};
      --radius: ${design.borderRadius};
    }
    body {
      font-family: ${design.fontFamily};
    }
    .bg-primary { background-color: var(--primary); }
    .text-primary { color: var(--primary); }
    .border-primary { border-color: var(--primary); }
    .focus\\:ring-primary:focus { --tw-ring-color: var(--primary); }
    
    .rounded-lg { border-radius: var(--radius); }
    .rounded-xl { border-radius: calc(var(--radius) * 1.5); }
    .rounded-2xl { border-radius: calc(var(--radius) * 2); }
    
    /* Reset section padding when wrapped by settings div */
    div > section { padding-top: 0 !important; padding-bottom: 0 !important; background-color: transparent !important; }
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
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
