# Visual Block Builder Design

## Overview
The Visual Block Builder allows users to create landing pages by assembling pre-defined blocks. Each block has a set of configurable properties.

## Data Structure
The `layout_data` column in `static_pages` will store an array of block objects:

```json
[
  {
    "id": "unique-id-1",
    "type": "hero",
    "content": {
      "title": "Selamat Datang",
      "subtitle": "Perjalanan Umroh Terbaik",
      "backgroundImage": "https://...",
      "ctaText": "Daftar Sekarang",
      "ctaLink": "/register"
    }
  },
  {
    "id": "unique-id-2",
    "type": "packages",
    "content": {
      "title": "Paket Populer",
      "limit": 3,
      "showPrice": true
    }
  }
]
```

## Block Types
1. **Hero**: Main banner with title, subtitle, and CTA.
2. **Features**: Grid of features with icons and descriptions.
3. **Testimonials**: Carousel or grid of user reviews.
4. **PackageList**: Dynamic list of packages from the database.
5. **FAQ**: Accordion list of frequently asked questions.
6. **Contact**: Contact form or WhatsApp button.
7. **RichText**: Standard text editor block for custom content.

## Implementation Strategy
1. **Block Registry**: A central definition of all available blocks, their default data, and their editor/renderer components.
2. **Editor Component**: A drag-and-drop interface to reorder blocks and a form to edit block properties.
3. **HTML Generator**: A function that takes `layout_data` and generates the final Tailwind-styled HTML to be saved in the `content` column.
4. **Navigation Manager**: A separate UI to manage `platform_settings['main_navigation']`.
5. **SEO Helper**: Logic to auto-generate meta tags based on block content.
