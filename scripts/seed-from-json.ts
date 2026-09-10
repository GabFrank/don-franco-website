/**
 * Script de seed D1 desde JSON existentes
 * 
 * Lee src/content/*.json y genera SQL seed para:
 * - text_blocks (hero, story, chips, footer, reviews, contact)
 * - settings (menuMode, whatsapp, placeId)
 * - beers
 * - menu_categories + menu_items
 * - review_quotes + review_stats
 * - contact_info
 * 
 * Salida: ops/d1/seed.sql
 * 
 * Uso:
 *   npm run seed:generate
 *   wrangler d1 execute don-franco-content --file=ops/d1/seed.sql
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Tipos para site.json
interface SiteData {
  siteName: string;
  tagline: string;
  metaDescription: string;
  hero: {
    title: string;
    tagline: string;
    description: string;
    ctaText: string;
    backgroundImages: string[];
  };
  menu: {
    mode: string;
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  beers: {
    title: string;
    items: Array<{
      name: string;
      style: string;
      notes: string;
      image: string;
    }>;
  };
  reviews: {
    title: string;
    placeId: string;
    rating: number;
    reviewCount: number;
    quotes: Array<{
      text: string;
      author: string;
    }>;
  };
  contact: {
    whatsapp: string;
    address: string;
    hours: string;
  };
  footer: {
    tagline: string;
    legalText: string;
  };
}

interface MenuData {
  categories: Array<{
    id: string;
    name: string;
    description: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      currency?: string;
      badge?: string;
    }>;
  }>;
}

// Utilidad para generar UUIDs simples
function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Escapar comillas simples para SQL
function sqlEscape(str: string): string {
  return str.replace(/'/g, "''");
}

// Leer archivos JSON
const contentDir = join(process.cwd(), 'src/content');
const siteData: SiteData = JSON.parse(readFileSync(join(contentDir, 'site.json'), 'utf-8'));
const menuData: MenuData = JSON.parse(readFileSync(join(contentDir, 'menu-digital.json'), 'utf-8'));

let sql = `-- ============================================================
-- DON FRANCO SEED DATA
-- Generado automáticamente desde src/content/*.json
-- Fecha: ${new Date().toISOString()}
-- ============================================================

`;

// ============================================================
// SETTINGS
// ============================================================
sql += `\n-- SETTINGS (configuración global)\n`;
sql += `INSERT INTO settings (key, value, description) VALUES\n`;
sql += `  ('menuMode', '${siteData.menu.mode}', 'Modo de visualización del menú: png|digital|both'),\n`;
sql += `  ('whatsapp', '${siteData.contact.whatsapp}', 'Número de WhatsApp de contacto'),\n`;
sql += `  ('placeId', '${siteData.reviews.placeId || ''}', 'Google Place ID para reseñas');\n`;

// ============================================================
// TEXT BLOCKS
// ============================================================
sql += `\n-- TEXT BLOCKS (textos editables del sitio)\n`;
const textBlocks: Array<{ key: string; section: string; body: string; order: number }> = [];

// Hero
textBlocks.push({ key: 'hero.title', section: 'hero', body: siteData.hero.title, order: 0 });
textBlocks.push({ key: 'hero.tagline', section: 'hero', body: siteData.hero.tagline, order: 1 });
textBlocks.push({ key: 'hero.description', section: 'hero', body: siteData.hero.description, order: 2 });
textBlocks.push({ key: 'hero.ctaText', section: 'hero', body: siteData.hero.ctaText, order: 3 });

// Story
textBlocks.push({ key: 'story.title', section: 'story', body: siteData.story.title, order: 0 });
siteData.story.paragraphs.forEach((p, i) => {
  textBlocks.push({ key: `story.paragraph.${i}`, section: 'story', body: p, order: i + 1 });
});

// Beers
textBlocks.push({ key: 'beers.title', section: 'beers', body: siteData.beers.title, order: 0 });

// Reviews
textBlocks.push({ key: 'reviews.title', section: 'reviews', body: siteData.reviews.title, order: 0 });

// Footer
textBlocks.push({ key: 'footer.tagline', section: 'footer', body: siteData.footer.tagline, order: 0 });
textBlocks.push({ key: 'footer.legalText', section: 'footer', body: siteData.footer.legalText, order: 1 });

sql += `INSERT INTO text_blocks (id, key, section, body, visible, sort_order) VALUES\n`;
sql += textBlocks.map((tb, i) => 
  `  ('${uuid()}', '${tb.key}', '${tb.section}', '${sqlEscape(tb.body)}', 1, ${tb.order})`
).join(',\n');
sql += `;\n`;

// ============================================================
// BEERS
// ============================================================
sql += `\n-- BEERS (cervezas artesanales)\n`;
sql += `INSERT INTO beers (id, name, style, notes, image_id, visible, sort_order) VALUES\n`;
sql += siteData.beers.items.map((beer, i) => 
  `  ('${uuid()}', '${sqlEscape(beer.name)}', '${sqlEscape(beer.style)}', '${sqlEscape(beer.notes)}', NULL, 1, ${i})`
).join(',\n');
sql += `;\n`;

// ============================================================
// MENU CATEGORIES + ITEMS
// ============================================================
sql += `\n-- MENU CATEGORIES\n`;
const categoryIds: Record<string, string> = {};
sql += `INSERT INTO menu_categories (id, title, visible, sort_order) VALUES\n`;
sql += menuData.categories.map((cat, i) => {
  const id = uuid();
  categoryIds[cat.id] = id;
  return `  ('${id}', '${sqlEscape(cat.name)}', 1, ${i})`;
}).join(',\n');
sql += `;\n`;

sql += `\n-- MENU ITEMS\n`;
const allItems: string[] = [];
menuData.categories.forEach((cat) => {
  cat.items.forEach((item, i) => {
    const itemSql = `  ('${uuid()}', '${categoryIds[cat.id]}', '${sqlEscape(item.name)}', '${sqlEscape(item.description)}', ${item.price}, ${item.badge ? `'${sqlEscape(item.badge)}'` : 'NULL'}, NULL, 1, ${i})`;
    allItems.push(itemSql);
  });
});
sql += `INSERT INTO menu_items (id, category_id, name, description, price, badge, image_id, visible, sort_order) VALUES\n`;
sql += allItems.join(',\n');
sql += `;\n`;

// ============================================================
// REVIEW QUOTES + STATS
// ============================================================
sql += `\n-- REVIEW QUOTES\n`;
sql += `INSERT INTO review_quotes (id, author, text, visible, sort_order) VALUES\n`;
sql += siteData.reviews.quotes.map((q, i) => 
  `  ('${uuid()}', '${sqlEscape(q.author)}', '${sqlEscape(q.text)}', 1, ${i})`
).join(',\n');
sql += `;\n`;

sql += `\n-- REVIEW STATS\n`;
sql += `INSERT INTO review_stats (rating, review_count, block_visible) VALUES\n`;
sql += `  (${siteData.reviews.rating}, ${siteData.reviews.reviewCount}, 1);\n`;

// ============================================================
// CONTACT INFO
// ============================================================
sql += `\n-- CONTACT INFO\n`;
sql += `INSERT INTO contact_info (whatsapp, address, hours) VALUES\n`;
sql += `  ('${siteData.contact.whatsapp}', '${sqlEscape(siteData.contact.address)}', '${sqlEscape(siteData.contact.hours)}');\n`;

// Escribir archivo
const outputPath = join(process.cwd(), 'ops/d1/seed.sql');
writeFileSync(outputPath, sql, 'utf-8');

console.log('✅ Seed SQL generado exitosamente');
console.log(`   Archivo: ${outputPath}`);
console.log(`\nEstadísticas:`);
console.log(`   - Text blocks: ${textBlocks.length}`);
console.log(`   - Cervezas: ${siteData.beers.items.length}`);
console.log(`   - Categorías menú: ${menuData.categories.length}`);
console.log(`   - Items menú: ${allItems.length}`);
console.log(`   - Review quotes: ${siteData.reviews.quotes.length}`);
console.log(`\nPara aplicar el seed:`);
console.log(`   wrangler d1 execute don-franco-content --file=ops/d1/seed.sql`);
