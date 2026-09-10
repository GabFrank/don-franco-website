# Fase 1: Infraestructura Admin Panel — Runbook

**Objetivo:** Configurar D1 + R2, aplicar schema, seed desde JSON y migrar media desde Drive.

**Fecha:** 2026-09-10  
**Scope:** Solo infraestructura backend. NO incluye UI admin ni APIs CRUD.

---

## Prerequisitos

1. **Wrangler CLI instalado y autenticado:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Variables de entorno (opcional para migración Drive):**
   ```bash
   # .env.local
   GOOGLE_DRIVE_API_KEY=your_key_here
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   R2_BUCKET_NAME=don-franco-media
   ```

3. **Node.js >= 18** (para ejecutar scripts TypeScript)

---

## Paso 1: Crear recursos Cloudflare

### 1.1. Crear base de datos D1

```bash
wrangler d1 create don-franco-content
```

**Salida esperada:**
```
✅ Successfully created DB 'don-franco-content'!

[[d1_databases]]
binding = "DB"
database_name = "don-franco-content"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Acción:** Copiar `database_id` y actualizar `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "don-franco-content",
      "database_id": "PEGAR_DATABASE_ID_AQUI"  // ← Actualizar
    }
  ]
}
```

### 1.2. Crear bucket R2

```bash
wrangler r2 bucket create don-franco-media
```

**Salida esperada:**
```
✅ Created bucket 'don-franco-media' with default storage class set to Standard.
```

---

## Paso 2: Aplicar schema D1

```bash
wrangler d1 execute don-franco-content --file=ops/d1/schema.sql
```

**Salida esperada:**
```
🌀 Executing on don-franco-content (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
🌀 To execute on your remote database, add a --remote flag to your wrangler command.

├ 🚣 Executed 18 commands in 0.123s

┌───────────────────────────────────────────────────────────┐
│ Successfully executed 18 SQL statements                   │
└───────────────────────────────────────────────────────────┘
```

**Verificar tablas creadas:**
```bash
wrangler d1 execute don-franco-content --command="SELECT name FROM sqlite_master WHERE type='table';"
```

**Debe mostrar:**
- settings
- text_blocks
- images
- beers
- menu_categories
- menu_items
- menu_pages
- gallery_images
- review_quotes
- review_stats
- contact_info
- publish_log

---

## Paso 3: Generar y aplicar seed desde JSON

### 3.1. Generar seed SQL

```bash
npm run seed:generate
```

**Salida esperada:**
```
✅ Seed SQL generado exitosamente
   Archivo: /workspace/ops/d1/seed.sql

Estadísticas:
   - Text blocks: 15
   - Cervezas: 3
   - Categorías menú: 5
   - Items menú: 18
   - Review quotes: 2

Para aplicar el seed:
   wrangler d1 execute don-franco-content --file=ops/d1/seed.sql
```

### 3.2. Aplicar seed a D1

```bash
wrangler d1 execute don-franco-content --file=ops/d1/seed.sql
```

**Verificar datos:**
```bash
# Contar text blocks
wrangler d1 execute don-franco-content --command="SELECT COUNT(*) as count FROM text_blocks;"

# Contar cervezas
wrangler d1 execute don-franco-content --command="SELECT COUNT(*) as count FROM beers;"

# Contar categorías menú
wrangler d1 execute don-franco-content --command="SELECT COUNT(*) as count FROM menu_categories;"

# Contar items menú
wrangler d1 execute don-franco-content --command="SELECT COUNT(*) as count FROM menu_items;"
```

**Counts esperados:**
- `text_blocks`: ~15-20 (depende de párrafos story)
- `beers`: 3
- `menu_categories`: 5
- `menu_items`: ~18
- `review_quotes`: 2

---

## Paso 4: Migrar media Drive → R2

### 4.1. Dry-run (sin descargar/upload)

```bash
npm run migrate:media -- --dry-run
```

**Salida esperada:**
```
🚀 Iniciando migración Drive → R2
   Modo: DRY RUN (sin descarga/upload)
   Bucket R2: don-franco-media

📸 Procesando hero backgrounds...
   ✓ hero-backgrounds/bg-01.jpg (dry-run)
   ✓ hero-backgrounds/bg-02.jpg (dry-run)

📄 Procesando menu pages...
   ✓ menu-pages/page-01.png (dry-run)
   ✓ menu-pages/page-02.png (dry-run)
   ...
   ✓ menu-pages/page-12.png (dry-run)

✅ Migración completada
   Imágenes procesadas: 4
   Páginas menú procesadas: 12
```

### 4.2. Ejecutar migración real

**⚠️ Requiere `GOOGLE_DRIVE_API_KEY` en `.env.local` o variables de entorno.**

```bash
npm run migrate:media
```

**Si falla por falta de API key:**
```
⚠️  GOOGLE_DRIVE_API_KEY no configurado — descarga desde Drive deshabilitada
   Continuando en modo estructura (sin download)...
```

**Acción:** Configurar API key de Google Drive:
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto → Habilitar Drive API
3. Crear credenciales → API Key
4. Agregar a `.env.local`: `GOOGLE_DRIVE_API_KEY=your_key`
5. Re-ejecutar `npm run migrate:media`

### 4.3. Aplicar migration seed

```bash
wrangler d1 execute don-franco-content --file=ops/d1/migration-seed.sql
```

**Verificar:**
```bash
# Contar imágenes
wrangler d1 execute don-franco-content --command="SELECT COUNT(*) as count FROM images;"

# Contar páginas menú
wrangler d1 execute don-franco-content --command="SELECT COUNT(*) as count FROM menu_pages;"
```

**Counts esperados:**
- `images`: ~4 (2 hero + 2 gallery fallbacks, si están configurados)
- `menu_pages`: 12

---

## Paso 5: Verificación completa

### 5.1. Verificar schema completo

```bash
wrangler d1 execute don-franco-content --command="
  SELECT 
    (SELECT COUNT(*) FROM settings) as settings,
    (SELECT COUNT(*) FROM text_blocks WHERE visible=1) as text_blocks_visible,
    (SELECT COUNT(*) FROM images WHERE visible=1) as images_visible,
    (SELECT COUNT(*) FROM beers WHERE visible=1) as beers_visible,
    (SELECT COUNT(*) FROM menu_categories WHERE visible=1) as categories_visible,
    (SELECT COUNT(*) FROM menu_items WHERE visible=1) as items_visible,
    (SELECT COUNT(*) FROM menu_pages WHERE visible=1) as pages_visible,
    (SELECT COUNT(*) FROM review_quotes WHERE visible=1) as quotes_visible;
"
```

### 5.2. Verificar defaults `visible = 1`

```bash
wrangler d1 execute don-franco-content --command="
  SELECT 'text_blocks' as table_name, COUNT(*) as hidden 
  FROM text_blocks WHERE visible = 0
  UNION ALL
  SELECT 'beers', COUNT(*) FROM beers WHERE visible = 0
  UNION ALL
  SELECT 'menu_categories', COUNT(*) FROM menu_categories WHERE visible = 0
  UNION ALL
  SELECT 'menu_items', COUNT(*) FROM menu_items WHERE visible = 0;
"
```

**Resultado esperado:** Todas las filas deben tener `hidden = 0` (ningún item oculto por default).

### 5.3. Verificar FKs

```bash
# Verificar que beers.image_id apunta a images válidos
wrangler d1 execute don-franco-content --command="
  SELECT COUNT(*) as invalid_fk 
  FROM beers b 
  WHERE b.image_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM images i WHERE i.id = b.image_id);
"

# Verificar que menu_items.category_id apunta a categorías válidas
wrangler d1 execute don-franco-content --command="
  SELECT COUNT(*) as invalid_fk 
  FROM menu_items mi 
  WHERE NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.id = mi.category_id);
"
```

**Resultado esperado:** `invalid_fk = 0` en ambos casos.

### 5.4. Verificar R2 uploads (si migración fue exitosa)

```bash
wrangler r2 object list don-franco-media --prefix=hero-backgrounds/
wrangler r2 object list don-franco-media --prefix=menu-pages/
```

**Debe mostrar:**
- `hero-backgrounds/bg-01.jpg`, `bg-02.jpg`
- `menu-pages/page-01.png` ... `page-12.png`

---

## Paso 6: Build del sitio Astro (sin cambios)

**Fase 1 NO modifica el sitio público.** Verificar que build sigue funcionando:

```bash
npm run build
```

**Salida esperada:**
```
✅ Build completed successfully
```

Si falla, es un problema de regresión (Fase 1 no debe afectar build).

---

## Troubleshooting

### Error: `database_id not found`
**Causa:** `wrangler.jsonc` no actualizado con ID de D1 creado.  
**Solución:** Copiar `database_id` de output de `wrangler d1 create` y pegar en `wrangler.jsonc`.

### Error: `GOOGLE_DRIVE_API_KEY not configured`
**Causa:** Script de migración requiere API key para descargar desde Drive.  
**Solución:** 
1. Configurar API key en `.env.local`
2. O ejecutar en dry-run: `npm run migrate:media -- --dry-run`

### Error: `R2 bucket not found`
**Causa:** Bucket R2 no creado.  
**Solución:** `wrangler r2 bucket create don-franco-media`

### Error: `FOREIGN KEY constraint failed`
**Causa:** Seed intentando insertar FK inválidas.  
**Solución:** Verificar que `schema.sql` se aplicó correctamente antes de seed.

---

## Checklist final Fase 1

- [ ] D1 database `don-franco-content` creado
- [ ] R2 bucket `don-franco-media` creado
- [ ] `wrangler.jsonc` actualizado con `database_id`
- [ ] Schema aplicado: 12 tablas creadas
- [ ] Seed aplicado: text_blocks, beers, menu, reviews, contact insertados
- [ ] Migration seed aplicado: images + menu_pages insertados
- [ ] Todos los `visible` defaults = 1
- [ ] FK constraints válidas
- [ ] Build Astro sigue funcionando sin errores

---

## Próximos pasos (Fase 2)

**NO implementar en este PR:**
- UI admin en `/admin`
- Pages Functions CRUD APIs
- Cloudflare Access configuración
- Integración Astro con D1

Estos son scope de **Fase 2-4** según `PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md`.

---

**Documentación generada:** 2026-09-10  
**Última actualización:** Fase 1 inicial
