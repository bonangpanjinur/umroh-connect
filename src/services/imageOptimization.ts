/**
 * Image Optimization Service
 * Provides utilities for optimizing image URLs for better performance.
 */

/**
 * Optimizes a Supabase storage URL by adding transformation parameters.
 * Note: This requires Supabase Image Transformation to be enabled on the project.
 * 
 * @param url The original image URL
 * @param options Optimization options
 * @returns The optimized URL
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'origin';
    resize?: 'cover' | 'contain' | 'fill';
  } = {}
): string {
  if (!url) return '';

  // Only optimize Supabase storage URLs
  if (!url.includes('supabase.co/storage/v1/render/image/public/')) {
    // If it's a standard public URL, we can try to convert it to a render URL
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      const {
        width,
        height,
        quality = 80,
        format = 'webp',
        resize = 'cover'
      } = options;

      // Convert object URL to render URL
      // From: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      // To:   https://[project].supabase.co/storage/v1/render/image/public/[bucket]/[path]?width=...
      const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      
      const params = new URLSearchParams();
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      params.append('quality', quality.toString());
      params.append('format', format);
      params.append('resize', resize);

      return `${renderUrl}?${params.toString()}`;
    }
    return url;
  }

  // If it's already a render URL, update/add parameters
  try {
    const urlObj = new URL(url);
    if (options.width) urlObj.searchParams.set('width', options.width.toString());
    if (options.height) urlObj.searchParams.set('height', options.height.toString());
    if (options.quality) urlObj.searchParams.set('quality', options.quality.toString());
    if (options.format) urlObj.searchParams.set('format', options.format);
    if (options.resize) urlObj.searchParams.set('resize', options.resize);
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

/**
 * Generates a srcset for responsive images
 */
export function getImageSrcSet(url: string | null | undefined): string {
  if (!url) return '';
  
  const sizes = [640, 750, 828, 1080, 1200, 1920, 2048];
  return sizes
    .map(size => `${getOptimizedImageUrl(url, { width: size })} ${size}w`)
    .join(', ');
}
