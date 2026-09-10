/**
 * Endpoint público para contenido del sitio
 * GET /api/public/content
 * 
 * NO requiere autenticación
 * Retorna solo contenido con visible=1 AND deleted_at IS NULL
 * Incluye cascada para menú (category AND item visible)
 */

import type { Env } from '../../_shared/auth';
import { jsonResponse, corsOptions } from '../../_shared/db-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // Text blocks
    const textBlocks = await env.DB
      .prepare('SELECT * FROM text_blocks WHERE visible = 1 AND deleted_at IS NULL ORDER BY section, sort_order')
      .all();

    // Images
    const images = await env.DB
      .prepare('SELECT * FROM images WHERE visible = 1 AND deleted_at IS NULL ORDER BY section, sort_order')
      .all();

    // Beers (con imagen)
    const beers = await env.DB
      .prepare(`
        SELECT b.*, i.r2_key as image_r2_key, i.visible as image_visible
        FROM beers b
        LEFT JOIN images i ON b.image_id = i.id
        WHERE b.visible = 1 AND b.deleted_at IS NULL
        ORDER BY b.sort_order
      `)
      .all();

    // Menu categories (solo visibles)
    const menuCategories = await env.DB
      .prepare('SELECT * FROM menu_categories WHERE visible = 1 AND deleted_at IS NULL ORDER BY sort_order')
      .all();

    // Menu items (con cascada: solo si category Y item son visibles)
    const menuItems = await env.DB
      .prepare(`
        SELECT mi.*, mc.title as category_title, i.r2_key as image_r2_key
        FROM menu_items mi
        JOIN menu_categories mc ON mi.category_id = mc.id
        LEFT JOIN images i ON mi.image_id = i.id
        WHERE mi.visible = 1 AND mi.deleted_at IS NULL
          AND mc.visible = 1 AND mc.deleted_at IS NULL
        ORDER BY mi.category_id, mi.sort_order
      `)
      .all();

    // Menu pages (PNG slides)
    const menuPages = await env.DB
      .prepare('SELECT * FROM menu_pages WHERE visible = 1 AND deleted_at IS NULL ORDER BY sort_order')
      .all();

    // Gallery images
    const galleryImages = await env.DB
      .prepare('SELECT * FROM gallery_images WHERE visible = 1 AND deleted_at IS NULL ORDER BY sort_order')
      .all();

    // Review quotes
    const reviewQuotes = await env.DB
      .prepare('SELECT * FROM review_quotes WHERE visible = 1 AND deleted_at IS NULL ORDER BY sort_order')
      .all();

    // Review stats (solo si block_visible = 1)
    const reviewStats = await env.DB
      .prepare('SELECT * FROM review_stats WHERE id = 1 AND block_visible = 1')
      .first();

    // Contact info (siempre visible)
    const contactInfo = await env.DB
      .prepare('SELECT * FROM contact_info WHERE id = 1')
      .first();

    // Settings
    const settingsResult = await env.DB
      .prepare('SELECT * FROM settings')
      .all();

    // Convertir settings a objeto key-value
    const settings: Record<string, string> = {};
    settingsResult.results?.forEach((s: any) => {
      settings[s.key] = s.value;
    });

    // Construir respuesta estructurada
    const content = {
      textBlocks: textBlocks.results || [],
      images: images.results || [],
      beers: beers.results || [],
      menu: {
        categories: menuCategories.results || [],
        items: menuItems.results || [],
        pages: menuPages.results || [],
      },
      gallery: galleryImages.results || [],
      reviews: {
        stats: reviewStats || null,
        quotes: reviewQuotes.results || [],
      },
      contact: contactInfo || null,
      settings,
    };

    return jsonResponse(content);
  } catch (error) {
    console.error('[public/content] GET error:', error);
    return jsonResponse({ error: 'Failed to fetch public content' }, 500);
  }
};
