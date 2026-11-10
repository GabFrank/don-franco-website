# D1 Migrations & Seed

Schema SQL y archivos de seed para la base de datos D1 del admin panel.

## Archivos

- **`schema.sql`** — DDL completo con todas las tablas, índices y constraints (Apéndice A del plan)
- **`seed.sql`** — (Generado por `npm run seed:generate`) Datos iniciales desde `src/content/*.json`
- **`migration-seed.sql`** — (Generado por `npm run migrate:media`) Seed de imágenes y menu pages migrados desde Drive a R2

## Workflow

### 1. Crear base de datos

```bash
wrangler d1 create don-franco-content
```

Actualizar `database_id` en `wrangler.jsonc`.

### 2. Aplicar schema

```bash
wrangler d1 execute don-franco-content --file=ops/d1/schema.sql
```

### 3. Generar y aplicar seed

```bash
npm run seed:generate
wrangler d1 execute don-franco-content --file=ops/d1/seed.sql
```

### 4. Migrar media y aplicar migration seed

```bash
npm run migrate:media
wrangler d1 execute don-franco-content --file=ops/d1/migration-seed.sql
```

## Schema overview

| Tabla | Descripción | Tiene `visible`? | Tiene `deleted_at`? |
|-------|-------------|------------------|---------------------|
| `settings` | Config global (menuMode, whatsapp, placeId) | No | No |
| `text_blocks` | Textos editables (hero, story, footer, etc.) | Sí | Sí |
| `images` | Imágenes (hero bg, gallery, beers) | Sí | Sí |
| `beers` | Cervezas artesanales | Sí | Sí |
| `menu_categories` | Categorías menú digital | Sí | Sí |
| `menu_items` | Items menú digital | Sí | Sí |
| `menu_pages` | Páginas PNG carta física | Sí | Sí |
| `gallery_images` | Fotos galería | Sí | Sí |
| `review_quotes` | Citas de reseñas | Sí | Sí |
| `review_stats` | Rating/count aggregados | `block_visible` | No |
| `contact_info` | WhatsApp, dirección, horarios | No | No |
| `publish_log` | Auditoría de publicaciones | No | No |

## Defaults importantes

- **`visible`**: Default = `1` (visible) en todas las tablas que lo soportan
- **`deleted_at`**: Default = `NULL` (no borrado)
- **Timestamps**: `created_at`, `updated_at` con `unixepoch()` automático

## Verificación post-migration

```bash
# Contar todas las tablas
wrangler d1 execute don-franco-content --command="
  SELECT 
    (SELECT COUNT(*) FROM text_blocks WHERE visible=1) as text_blocks,
    (SELECT COUNT(*) FROM beers WHERE visible=1) as beers,
    (SELECT COUNT(*) FROM menu_categories WHERE visible=1) as categories,
    (SELECT COUNT(*) FROM menu_items WHERE visible=1) as items,
    (SELECT COUNT(*) FROM menu_pages WHERE visible=1) as pages,
    (SELECT COUNT(*) FROM review_quotes WHERE visible=1) as quotes;
"

# Verificar que no hay items ocultos por default
wrangler d1 execute don-franco-content --command="
  SELECT 
    'beers' as table_name, COUNT(*) as hidden FROM beers WHERE visible=0
    UNION ALL
    SELECT 'menu_items', COUNT(*) FROM menu_items WHERE visible=0;
"
```

Expected counts (si todos los JSON están completos):
- `text_blocks`: ~15-20
- `beers`: 3
- `menu_categories`: 5
- `menu_items`: ~18
- `menu_pages`: 12
- `review_quotes`: 2

## Ver también

- [PHASE1-ADMIN-RUNBOOK.md](../planes/PHASE1-ADMIN-RUNBOOK.md) — Guía completa paso a paso
- [PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md](../planes/PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md) — Plan completo con apéndices
