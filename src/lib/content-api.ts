/**
 * Content API client para Astro
 * 
 * Fetch content desde /api/public/content (D1) con fallback a JSON estático.
 * Usado en build-time para pre-renderizar el sitio con contenido filtrado (visible=1).
 */

import siteJson from '../content/site.json';
import menuPagesJson from '../content/menu-pages.json';
import menuDigitalJson from '../content/menu-digital.json';

export interface TextBlock {
  id: string;
  key: string;
  section: string;
  body: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Image {
  id: string;
  key: string;
  section: string;
  r2_key: string;
  alt: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Beer {
  id: string;
  name: string;
  style: string | null;
  notes: string | null;
  image_id: string | null;
  visible: number;
  sort_order: number;
  image_r2_key?: string | null;
  image_visible?: number;
}

export interface MenuCategory {
  id: string;
  title: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  badge: string | null;
  image_id: string | null;
  visible: number;
  sort_order: number;
  category_title?: string;
  image_r2_key?: string | null;
}

export interface MenuPage {
  id: string;
  title: string;
  r2_key: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface GalleryImage {
  id: string;
  r2_key: string;
  alt: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ReviewQuote {
  id: string;
  author: string;
  text: string;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface ReviewStats {
  id: number;
  rating: number;
  review_count: number;
  block_visible: number;
  updated_at: number;
}

export interface ContactInfo {
  id: number;
  whatsapp: string;
  address: string;
  hours: string;
  updated_at: number;
}

export interface PublicContent {
  textBlocks: TextBlock[];
  images: Image[];
  beers: Beer[];
  menu: {
    categories: MenuCategory[];
    items: MenuItem[];
    pages: MenuPage[];
  };
  gallery: GalleryImage[];
  reviews: {
    stats: ReviewStats | null;
    quotes: ReviewQuote[];
  };
  contact: ContactInfo | null;
  settings: Record<string, string>;
}

/**
 * Helper para obtener text blocks por section y key
 */
export function getTextBlock(content: PublicContent, section: string, key: string): string | null {
  const block = content.textBlocks.find(tb => tb.section === section && tb.key === key);
  return block ? block.body : null;
}

/**
 * Helper para obtener imágenes por section
 */
export function getImages(content: PublicContent, section: string): Image[] {
  return content.images.filter(img => img.section === section);
}

/**
 * Convierte R2 key a URL pública
 * En MVP: construir URL del Worker proxy /media/{r2_key}
 */
export function getR2ImageUrl(r2Key: string | null | undefined): string {
  if (!r2Key) return '';
  // En producción, esto llamaría al Worker proxy que valida visible=1
  // Para MVP, retornamos ruta directa (asumir R2 bucket público o presigned URLs)
  return `/media/${r2Key}`;
}

/**
 * Fetch content desde API pública con fallback a JSON
 */
export async function fetchPublicContent(): Promise<PublicContent> {
  const API_URL = import.meta.env.PUBLIC_CONTENT_API_URL || 'http://localhost:8788/api/public/content';
  
  try {
    const response = await fetch(API_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[content-api] ✓ Fetched from API:', API_URL);
      return data as PublicContent;
    } else {
      console.warn('[content-api] API returned non-OK status, falling back to JSON');
    }
  } catch (error) {
    console.warn('[content-api] API fetch failed, falling back to JSON:', error);
  }

  // Fallback: construir contenido desde JSON estático
  console.log('[content-api] Using JSON fallback');
  return buildFallbackContent();
}

/**
 * Construye PublicContent desde JSON estáticos (para dev/fallback)
 */
function buildFallbackContent(): PublicContent {
  // Text blocks desde site.json
  const textBlocks: TextBlock[] = [
    {
      id: 'hero-title',
      key: 'hero.title',
      section: 'hero',
      body: siteJson.hero.title,
      visible: 1,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    },
    {
      id: 'hero-tagline',
      key: 'hero.tagline',
      section: 'hero',
      body: siteJson.hero.tagline,
      visible: 1,
      sort_order: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    },
    {
      id: 'hero-description',
      key: 'hero.description',
      section: 'hero',
      body: siteJson.hero.description,
      visible: 1,
      sort_order: 2,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    },
    {
      id: 'hero-cta',
      key: 'hero.ctaText',
      section: 'hero',
      body: siteJson.hero.ctaText,
      visible: 1,
      sort_order: 3,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    },
    // Story paragraphs
    ...siteJson.story.paragraphs.map((p, i) => ({
      id: `story-para-${i}`,
      key: `story.paragraph.${i}`,
      section: 'story',
      body: p,
      visible: 1,
      sort_order: i,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    })),
  ];

  // Story chips (hardcoded en el componente original, pero los incluimos para consistencia)
  const storyChips = [
    '2018 · Primera cerveza artesanal de la región',
    '2020 · Restaurante',
    'Hecho en Salto del Guairá'
  ];
  
  storyChips.forEach((chip, i) => {
    textBlocks.push({
      id: `story-chip-${i}`,
      key: `story.chip.${i}`,
      section: 'story',
      body: chip,
      visible: 1,
      sort_order: 100 + i,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });
  });

  // Images desde site.json (hero backgrounds)
  const images: Image[] = siteJson.hero.backgroundImages.map((url, i) => ({
    id: `hero-bg-${i}`,
    key: `hero.bg.${i}`,
    section: 'hero_bg',
    r2_key: url, // En fallback, mantenemos Drive URLs tal cual
    alt: `Hero background ${i + 1}`,
    visible: 1,
    sort_order: i,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
  }));

  // Gallery fallback images
  if (siteJson.gallery.fallbackImages) {
    siteJson.gallery.fallbackImages.forEach((fileId, i) => {
      images.push({
        id: `gallery-${i}`,
        key: `gallery.${i}`,
        section: 'gallery',
        r2_key: `https://drive.google.com/file/d/${fileId}/view`,
        alt: `Foto ${i + 1}`,
        visible: 1,
        sort_order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: null,
      });
    });
  }

  // Beers
  const beers: Beer[] = siteJson.beers.items
    .filter((b: any) => b.name)
    .map((b: any, i: number) => ({
      id: `beer-${i}`,
      name: b.name,
      style: b.style || null,
      notes: b.notes || null,
      image_id: b.image ? `beer-img-${i}` : null,
      visible: 1,
      sort_order: i,
      image_r2_key: b.image || null,
      image_visible: b.image ? 1 : 0,
    }));

  // Menu categories & items
  const categories: MenuCategory[] = menuDigitalJson.categories.map((cat: any, i: number) => ({
    id: `cat-${i}`,
    title: cat.name,
    visible: 1,
    sort_order: i,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
  }));

  const items: MenuItem[] = [];
  menuDigitalJson.categories.forEach((cat: any, catIdx: number) => {
    if (cat.items) {
      cat.items.forEach((item: any, itemIdx: number) => {
        items.push({
          id: `item-${catIdx}-${itemIdx}`,
          category_id: `cat-${catIdx}`,
          name: item.name,
          description: item.description || null,
          price: item.price,
          badge: item.badge || null,
          image_id: null,
          visible: 1,
          sort_order: itemIdx,
          category_title: cat.name,
          image_r2_key: null,
        });
      });
    }
  });

  // Menu pages (PNG)
  const menuPages: MenuPage[] = menuPagesJson.pages.map((page: any, i: number) => ({
    id: `page-${i}`,
    title: page.title || page.alt || `Página ${i + 1}`,
    r2_key: page.url, // Drive URL en fallback
    visible: 1,
    sort_order: i,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
  }));

  // Gallery images (usando Drive como fallback)
  const galleryImages: GalleryImage[] = images.filter(img => img.section === 'gallery');

  // Review quotes
  const reviewQuotes: ReviewQuote[] = siteJson.reviews.quotes.map((q: any, i: number) => ({
    id: `quote-${i}`,
    author: q.author,
    text: q.text,
    visible: 1,
    sort_order: i,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
  }));

  // Review stats
  const reviewStats: ReviewStats = {
    id: 1,
    rating: siteJson.reviews.rating,
    review_count: siteJson.reviews.reviewCount,
    block_visible: 1,
    updated_at: Date.now(),
  };

  // Contact info
  const contactInfo: ContactInfo = {
    id: 1,
    whatsapp: siteJson.contact.whatsapp,
    address: siteJson.contact.address,
    hours: siteJson.contact.hours,
    updated_at: Date.now(),
  };

  // Settings
  const settings: Record<string, string> = {
    menuMode: siteJson.menu.mode,
    whatsapp: siteJson.contact.whatsapp,
    placeId: siteJson.reviews.placeId || '',
  };

  return {
    textBlocks,
    images,
    beers,
    menu: {
      categories,
      items,
      pages: menuPages,
    },
    gallery: galleryImages,
    reviews: {
      stats: reviewStats,
      quotes: reviewQuotes,
    },
    contact: contactInfo,
    settings,
  };
}
