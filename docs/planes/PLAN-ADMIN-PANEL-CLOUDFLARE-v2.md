# Plan v2: Panel de administración Don Franco (Cloudflare)

**Estado:** enmendado post-auditorías A/B — pendiente aprobación Gabriel para implementar  
**Fecha:** 2026-09-10 (v2 post-auditorías)  
**Repo:** `GabFrank/don-franco-website`  
**Branch trabajo sitio:** `cursor/feat-v2-greenfield-8e75` (PR #1 draft)  
**Sitio prod actual:** `donfrancorestaurante.com` (legacy) — **sin cutover** hasta OK explícito  

---

## 1. Objetivo

Panel propio para editar textos, imágenes, menú/cervezas y reseñas **sin tocar código**, con control fino de qué se muestra públicamente.

---

## 2. Requisito transversal: "Mostrar"

- **Cada texto** (bloque o campo renderizable) y **cada imagen** tiene un booleano `visible` (UI: checkbox **Mostrar**).
- **Default: `1` (true).**
- `visible = 0` → el sitio público **no renderiza** ese ítem (no borrar datos).
- Borrado duro es acción aparte (confirmación + modal peligro).
- Aplica a: líneas de hero, párrafos story, chips, ítems de menú, cervezas (card completa o solo foto), slides de carta PNG, fotos de galería, citas de reseñas, etc.

### 2.1. Granularidad de `visible` (CERRADO post-auditoría)

| Entidad | Nivel de visible | Comportamiento |
|---------|-----------------|----------------|
| **Hero** | `text_blocks` individuales: `hero.title`, `hero.description`, `hero.ctaText` c/u con visible propio | Ocultar title → desaparece h1; description sigue si visible=1 |
| **Hero backgrounds** | `images` individuales: cada imagen del carrusel con visible propio | Ocultar imagen 2 → carrusel salta de 1 a 3 |
| **Story** | `text_blocks` por párrafo + `text_blocks` por chip independientes | Ocultar párrafo 2 → sección muestra 1,3,4; chips independientes |
| **Beers** | `beers.visible` (card) + `images.visible` (foto) — **DOS flags independientes** | Si beer.visible=0 → card no aparece. Si beer.visible=1 pero image.visible=0 → card muestra placeholder |
| **Menu digital** | `menu_categories.visible` + `menu_items.visible` — **cascada**: item público solo si item.visible=1 AND category.visible=1 | Ocultar categoría → todos sus items desaparecen aunque items.visible=1 |
| **Menu PNG** | `menu_pages.visible` individual por página | Ocultar página 5 → slideshow salta 4→6 |
| **Gallery** | `gallery_images.visible` individual por foto | Cada foto independiente |
| **Reviews** | `review_quotes.visible` individual + `review_stats.block_visible` para rating/count | Ocultar quote no afecta rating; ocultar block_visible oculta toda sección |
| **Contact** | Sin visible (datos core siempre visibles) | WhatsApp/dirección/horarios no tienen toggle Mostrar |

### 2.2. Soft-hide vs Hard-delete (CERRADO)

- **Soft-hide:** `visible = 0` → oculta en sitio público, recuperable con toggle en admin.
- **Hard-delete:** `deleted_at NOT NULL` → va a papelera, recuperable 30 días, requiere confirmación.
- **Borrado físico:** `DELETE FROM` + eliminación objeto R2 → requiere doble confirmación + solo Gabriel.

**Mostrar ≠ borrar.** Esto queda claro en UI con íconos diferentes (ojo/papelera/peligro).

---

## 3. Arquitectura (dirección) — CERRADO

| Pieza | Rol |
|--------|-----|
| Astro SSG en Cloudflare Pages | Sitio público v2 |
| Admin UI React/Vue en `/admin` | CRUD + uploads + Mostrar |
| Pages Functions | API autenticada (D1 + R2) |
| D1 | Contenido estructurado + flags `visible` + `deleted_at` |
| R2 | Binarios privados con signed URLs |
| Cloudflare Access | Auth (Gabriel + invitados) |
| Deploy hook Pages | "Publicar" → rebuild proyecto preview `don-franco-v2` |

### 3.1. Lectura pública (MVP)

**Mecanismo publicación:**
1. Admin UI botón **"Publicar"** → llama Pages Function autenticada `/api/publish`.
2. Function:
   - Marca revisión contenido en tabla `publish_log` (timestamp, usuario).
   - Llama webhook deploy de Pages proyecto `don-franco-v2`.
3. **Build-time:** Astro `astro build` llama endpoint interno `/api/public/content` (o usa binding D1 directo con Wrangler).
   - Endpoint filtra: `WHERE visible = 1 AND deleted_at IS NULL`.
   - Devuelve JSON con estructura compatible con `site.json` actual.
4. Astro genera HTML estático con contenido filtrado.
5. Deploy completa → Pages actualiza producción/preview.

**Lag aceptado:** 1-2 minutos documentado en UI ("Publicando... puede tardar 1-2 min").

**UI feedback:**
- Admin muestra estado: "Última publicación: 2026-09-10 14:32 por Gabriel".
- Polling cada 10s durante publish para actualizar estado a "Listo ✓".

---

## 4. Modelo de contenido (seed)

Migrar desde `src/content/site.json`, `menu-digital.json`, beers.

### 4.1. Entidades y visible aplicado

| Entidad | Descripción | ¿Tiene visible? |
|---------|-------------|----------------|
| `settings` | Config global (whatsapp, placeId, menuMode) | NO |
| `text_blocks` | Cada string renderizable (hero.title, story.paragraph.0..n, chips, footer strings) | SÍ, individual |
| `images` | Hero backgrounds, gallery, beer images, menu item images | SÍ, individual |
| `beers` | Card de cerveza (nombre, estilo, notas, FK a image) | SÍ, oculta card completa |
| `menu_categories` | Categorías menú digital | SÍ, cascada a items |
| `menu_items` | Items menú digital | SÍ, filtrado por category.visible AND item.visible |
| `menu_pages` | Páginas PNG carta física | SÍ, individual (slideshow salta ocultas) |
| `gallery_images` | Fotos galería sitio | SÍ, individual |
| `review_quotes` | Citas de reseñas | SÍ, individual |
| `review_stats` | Rating/count aggregados + block_visible para toda sección | SÍ, block-level |
| `contact_info` | WhatsApp, dirección, horarios | NO (datos core) |

Ver **Apéndice A** para schema D1 completo con DDL SQL.

---

## 5. Módulos admin MVP

| Módulo | Sub-secciones | Campos con Mostrar |
|--------|--------------|-------------------|
| **Textos** | Hero (title, description, CTA), Story (párrafos, chips), Contacto (whatsapp, dirección, horarios), Footer | Hero/Story sí; Contacto/Footer no (core data) |
| **Menú** | Digital (categorías + items), PNG (12 páginas slideshow) | Categorías, items, páginas — todas con visible |
| **Cervezas** | Lista de cervezas (nombre, estilo, notas, imagen) | Beer.visible + image.visible independientes |
| **Galería** | Grid de fotos | Cada imagen con visible |
| **Reseñas** | Rating/count + citas | Block_visible para sección + visible por quote |
| **Publicar** | Botón + status + log de publicaciones | N/A |

### 5.1. Validaciones requeridas (previenen publish inválido)

- **Hero:** Al menos uno de `title` o `description` debe tener `visible=1` (warning si ambos ocultos).
- **Hero CTA:** Warning si `ctaText.visible=0` Y `ctaLink.visible=0` (sin call-to-action).
- **Menu digital:** Al menos una categoría con `visible=1` si modo digital activo.
- **Beers:** Si `beers.visible=1` pero `image.visible=0` → renderiza con placeholder (aceptable, no bloquea).

Admin UI muestra warnings amarillos (no bloquea publish pero alerta).

---

## 6. Fases — ACTUALIZADAS

### Fase 0: Decisiones cerradas (COMPLETO)
- ✅ Monorepo (mismo repo que sitio v2).
- ✅ `/admin` con Cloudflare Access (no subdominio).
- ✅ R2 en MVP con script migración automatizada Drive→R2.

### Fase 1: Schema D1 + migración
1. Crear schema D1 (ver Apéndice A).
2. **Script migración Drive→R2:**
   - Leer `menu-pages.json`, `site.json` (backgroundImages, gallery fallbacks).
   - Descargar assets desde Drive URLs.
   - Subir a R2 con naming: `menu-pages/page-{01..12}.png`, `gallery/img-{uuid}.jpg`, `beers/{beer-id}.jpg`.
   - Poblar D1 con r2_keys + visible=1 default.
3. Seed manual de `text_blocks` desde site.json (hero, story, chips como filas separadas).
4. Validación post-migración: row counts, FK integrity, todos visible defaults correctos.

### Fase 2: API + R2 + Access
1. Pages Functions:
   - `/api/text-blocks` (CRUD con validación Access JWT).
   - `/api/images` (CRUD + upload R2 con presigned POST).
   - `/api/beers`, `/api/menu-categories`, `/api/menu-items`, `/api/menu-pages`, `/api/gallery-images`, `/api/review-quotes`, `/api/contact-info`.
   - `/api/publish` (marca log + trigger webhook Pages).
   - `/api/public/content` (lectura filtrada `visible=1 AND deleted_at IS NULL` para build-time).
2. **Validación Access JWT en TODAS las Functions mutating:**
   ```typescript
   const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
   if (!jwt || !await validateAccessJWT(jwt, env.ACCESS_AUD)) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```
3. **R2 seguridad:**
   - Bucket privado (no public URL directa).
   - Admin UI obtiene presigned URLs (PUT para upload, GET TTL 1h para preview).
   - Sitio público usa Worker proxy `/media/{r2_key}` que:
     - Valida que objeto pertenece a contenido con `visible=1` (query D1).
     - Devuelve blob desde R2 solo si validación pasa.
   - Alternativa MVP más simple: presigned GET URLs con TTL 24h regeneradas en cada build (acepta riesgo leak URLs descubiertas).

### Fase 3: Admin UI
1. React/Vue SPA en `/admin` (protegido por Access).
2. Módulos: Textos, Menú, Cervezas, Galería, Reseñas, Publicar.
3. **UX de visible:**
   - Checkbox "Mostrar" por ítem (default checked).
   - Items con `visible=0` aparecen en admin con clase `.item-hidden` (opacity 0.5) + badge "Oculto".
   - **Bulk operations:** "Mostrar todas" / "Ocultar todas" en listas largas (menu_pages con 12 páginas).
   - **Cascada UI:** Si category.visible=0, items dentro se muestran grises con tooltip "Categoría oculta — item no será público aunque esté marcado como visible".
4. Confirmaciones:
   - Soft-delete: modal "¿Mover a papelera?"
   - Hard-delete: modal rojo "⚠️ BORRADO PERMANENTE — no recuperable" + escribir nombre para confirmar.

### Fase 4: Integración sitio Astro v2 + Publicar
1. Astro components actualizados:
   - `Hero.astro` llama `/api/public/content` en build → obtiene text_blocks hero + images hero.
   - `StorySection.astro` obtiene story paragraphs + chips filtrados visible=1.
   - `BeerStrip.astro` obtiene beers con visible=1 (images con visible=0 muestran placeholder).
   - `MenuSection.astro` obtiene categories/items con cascada visible.
   - `GallerySection.astro` obtiene gallery_images filtradas.
   - `ReviewsSection.astro` obtiene review_stats (si block_visible=1) + quotes filtradas.
   - `ContactSection.astro` obtiene contact_info (siempre visible).
2. Admin UI botón "Publicar":
   - Llama `/api/publish`.
   - Muestra spinner + "Publicando... (1-2 min)".
   - Polling `/api/publish-status` cada 10s hasta `status: 'completed'`.
3. Webhook Pages configurado en Cloudflare dashboard → proyecto `don-franco-v2` preview.

### Fase 5: QA + documentación
1. **Testing exhaustivo de visible:**
   - ✅ Ocultar beer → no aparece en sitio tras publish.
   - ✅ Ocultar menu page 5 → slideshow salta 4→6.
   - ✅ Ocultar category Postres → items no aparecen aunque items.visible=1.
   - ✅ Ocultar hero.backgroundImages[0] → carrusel usa imágenes 2, 3.
   - ✅ Mostrar beer previamente oculta → reaparece tras publish.
   - ✅ Validación: ocultar hero title + description → warning amarillo en admin.
2. Documentación de usuario:
   - "Mostrar vs Borrar" (reversible vs confirmación).
   - "Publicar tarda 1-2 min — cambios no son instantáneos".
   - "URLs de imágenes ocultas pueden ser accesibles si alguien las guardó antes" (limitación MVP).

### Fase 6: Cutover (post-aprobación Gabriel)
- Configurar dominio producción → Pages deploy.
- Backup legacy site.
- Monitoreo primeros 7 días.

---

## 7. Fuera de MVP

- Checkout online.
- Multi-local (Asunción, Encarnación).
- Roles ricos (editor vs admin).
- Fake Google reviews integración.
- i18n (español/guaraní).
- Rollback de publicaciones (restore versión anterior).
- Preview URL antes de publish a producción (Pages preview branch separado).

---

## 8. Decisiones cerradas (post-auditorías)

| Decisión | Resultado | Justificación |
|----------|-----------|---------------|
| **Monorepo vs repo admin** | ✅ Monorepo | Types compartidos D1, deploy unificado, equipo pequeño (1-2 devs) |
| **Path admin** | ✅ `/admin` + Access | Más simple que subdominio, Access protege ruta completa |
| **Drive→R2 en MVP** | ✅ SÍ, con script automatizado | Evita dos migraciones, R2 es necesario para uploads admin |
| **R2 bucket público/privado** | ✅ Privado + signed URLs / Worker proxy | Seguridad: visible=0 no debe ser bypasseable con URL directa |
| **Soft-delete** | ✅ SÍ, columna `deleted_at` | Papelera recuperable 30 días, hard-delete separado |
| **Contacto editable** | ✅ SÍ, módulo en admin | WhatsApp/dirección/horarios frecuentemente actualizados |
| **Menu mode switcher** | ✅ Setting en D1 `menu_mode` (png/digital/both) | Editable en admin (dropdown), sin visible (config no contenido) |
| **Story chips editables** | ✅ SÍ, `text_blocks` con section='story_chip' | Fechas/lugares pueden cambiar (ej: agregar "2027 — Nueva sede") |

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| **Auth leakage (API sin validar JWT)** | 🔴 Crítico | Validar `Cf-Access-Jwt-Assertion` en TODAS las Functions (ver fase 2) |
| **Unpublish accidental** | 🟡 Medio | Validaciones pre-publish (warnings campos críticos ocultos) |
| **Rebuild lag confusión** | 🟡 Medio | UI clara "Publicando... 1-2 min" + polling status |
| **R2 URL leak (imagen oculta)** | 🟠 Medio-bajo | Worker proxy con validación visible ó presigned URLs TTL 24h + disclaimer en docs |
| **Cream token gotcha** | 🟢 Bajo | Documentar: Access tokens expiran, re-login requerido |
| **Race condition (dos admins publican)** | 🟡 Medio | MVP: deshabilitar botón Publicar durante rebuild en curso (lock UI-side) |
| **Migración Drive→R2 falla** | 🟠 Medio | Script con retry + validación post-migración + rollback plan |
| **Data loss (borrado físico)** | 🔴 Crítico | Doble confirmación + solo Gabriel puede hard-delete + backups D1 diarios |

---

## 10. Éxito (criterios)

1. ✅ Gabriel puede ocultar cerveza desde admin → desaparece en sitio tras "Publicar".
2. ✅ Gabriel puede agregar nueva cerveza con imagen upload → aparece tras publish.
3. ✅ Gabriel puede editar precio menú digital → actualiza tras publish.
4. ✅ Gabriel puede ocultar página 5 de carta PNG → slideshow salta correctamente.
5. ✅ Gabriel puede restaurar beer oculta (toggle Mostrar) → reaparece tras publish.
6. ✅ Producción legacy `donfrancorestaurante.com` intacto (no afectado hasta cutover).
7. ✅ Admin UI protegido por Access (no accesible sin auth).
8. ✅ API rechaza requests sin JWT válido (401 Unauthorized).

---

## Apéndice A: Schema D1 MVP (DDL completo)

```sql
-- ============================================================
-- SETTINGS (config global sin visible)
-- ============================================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Seed: menuMode (png|digital|both), whatsapp, placeId, etc.

-- ============================================================
-- TEXT BLOCKS (cada string renderizable con visible individual)
-- ============================================================
CREATE TABLE text_blocks (
  id TEXT PRIMARY KEY, -- uuid
  key TEXT NOT NULL UNIQUE, -- ej: 'hero.title', 'story.paragraph.0', 'story.chip.0'
  section TEXT NOT NULL, -- 'hero', 'story', 'footer'
  body TEXT NOT NULL,
  visible INTEGER DEFAULT 1, -- 0 = oculto, 1 = visible
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER -- NULL = activo, timestamp = soft-deleted
);

CREATE INDEX idx_text_blocks_section ON text_blocks(section);
CREATE INDEX idx_text_blocks_visible ON text_blocks(visible);
CREATE INDEX idx_text_blocks_deleted ON text_blocks(deleted_at);

-- Seed ejemplos:
-- ('hero.title', 'hero', 'Un lugar donde la cerveza artesanal...', 1, 0)
-- ('hero.description', 'hero', 'Cada sorbo cuenta una historia...', 1, 1)
-- ('story.paragraph.0', 'story', 'Don Franco nace de nuestra pasión...', 1, 0)
-- ('story.chip.0', 'story', '2018', 1, 0)

-- ============================================================
-- IMAGES (binarios en R2 con visible individual)
-- ============================================================
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- ej: 'hero.bg.0', 'gallery.001', 'beer.ipa'
  section TEXT NOT NULL, -- 'hero_bg', 'gallery', 'beer', 'menu_item'
  r2_key TEXT NOT NULL, -- path en R2: 'gallery/img-uuid.jpg'
  alt TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_images_section ON images(section);
CREATE INDEX idx_images_visible ON images(visible);

-- ============================================================
-- BEERS (cerveza con visible en card + FK a image)
-- ============================================================
CREATE TABLE beers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT,
  notes TEXT,
  image_id TEXT, -- FK a images, NULL = sin foto
  visible INTEGER DEFAULT 1, -- 0 = card no aparece
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
);

CREATE INDEX idx_beers_visible ON beers(visible);

-- ============================================================
-- MENU CATEGORIES (visible con cascada a items)
-- ============================================================
CREATE TABLE menu_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  visible INTEGER DEFAULT 1, -- 0 = categoría + items no aparecen en sitio
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

-- ============================================================
-- MENU ITEMS (visible filtrado por category.visible AND item.visible)
-- ============================================================
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER, -- centavos (45000 = 45000 Gs)
  badge TEXT, -- 'Premium', 'Nuevo', NULL
  image_id TEXT, -- FK a images (opcional)
  visible INTEGER DEFAULT 1, -- público solo si category.visible=1 AND item.visible=1
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_visible ON menu_items(visible);

-- ============================================================
-- MENU PAGES (PNG carta física con visible individual por página)
-- ============================================================
CREATE TABLE menu_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL, -- 'Página 1', 'Hamburguesas', etc.
  r2_key TEXT NOT NULL, -- 'menu-pages/page-01.png'
  visible INTEGER DEFAULT 1, -- 0 = slideshow salta esta página
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

CREATE INDEX idx_menu_pages_sort ON menu_pages(sort_order);

-- ============================================================
-- GALLERY IMAGES (fotos galería con visible individual)
-- ============================================================
CREATE TABLE gallery_images (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL,
  alt TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

-- ============================================================
-- REVIEW QUOTES (citas con visible individual)
-- ============================================================
CREATE TABLE review_quotes (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  deleted_at INTEGER
);

-- ============================================================
-- REVIEW STATS (rating/count + block_visible para toda sección)
-- ============================================================
CREATE TABLE review_stats (
  id INTEGER PRIMARY KEY DEFAULT 1, -- single row
  rating REAL NOT NULL, -- 4.5
  review_count INTEGER NOT NULL,
  block_visible INTEGER DEFAULT 1, -- 0 = toda sección Reviews no se renderiza
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Seed: rating 4.5, count 250+
INSERT INTO review_stats (rating, review_count, block_visible) 
VALUES (4.5, 250, 1);

-- ============================================================
-- CONTACT INFO (sin visible — datos core)
-- ============================================================
CREATE TABLE contact_info (
  id INTEGER PRIMARY KEY DEFAULT 1, -- single row
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  hours TEXT NOT NULL, -- JSON: {"lun-jue": "18:00-00:00", ...}
  updated_at INTEGER DEFAULT (unixepoch())
);

-- ============================================================
-- PUBLISH LOG (auditoría de publicaciones)
-- ============================================================
CREATE TABLE publish_log (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL, -- de Access JWT
  status TEXT NOT NULL, -- 'pending', 'building', 'completed', 'failed'
  webhook_response TEXT, -- JSON response de Pages webhook
  created_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER
);

CREATE INDEX idx_publish_log_status ON publish_log(status);
CREATE INDEX idx_publish_log_created ON publish_log(created_at DESC);
```

---

## Apéndice B: Script migración Drive→R2 (TypeScript)

```typescript
/**
 * Migración Drive → R2 + seed D1
 * 
 * Uso:
 *   npx tsx scripts/migrate-drive-to-r2.ts
 * 
 * Requiere:
 *   - GOOGLE_DRIVE_API_KEY en .env
 *   - CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME en wrangler.toml
 *   - D1 database binding configurado
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import fetch from 'node-fetch';

// Config
const DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!; // https://<account_id>.r2.cloudflarestorage.com
const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;

const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// Leer site.json + menu-pages.json
import siteJson from '../src/content/site.json';
import menuPagesJson from '../src/content/menu-pages.json';

interface MigrationResult {
  images: { key: string; r2_key: string; section: string }[];
  menu_pages: { title: string; r2_key: string; order: number }[];
  errors: string[];
}

async function downloadDriveFile(driveUrl: string): Promise<Buffer> {
  // Extraer file ID de URL Drive
  const match = driveUrl.match(/\/d\/([^/]+)/);
  if (!match) throw new Error(`URL Drive inválida: ${driveUrl}`);
  
  const fileId = match[1];
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${DRIVE_API_KEY}`;
  
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Download falló: ${response.statusText}`);
  
  return Buffer.from(await response.arrayBuffer());
}

async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

async function migrate(): Promise<MigrationResult> {
  const result: MigrationResult = { images: [], menu_pages: [], errors: [] };

  // 1. Migrar hero backgrounds
  console.log('📸 Migrando hero backgrounds...');
  for (let i = 0; i < siteJson.hero.backgroundImages.length; i++) {
    try {
      const driveUrl = siteJson.hero.backgroundImages[i];
      const buffer = await downloadDriveFile(driveUrl);
      const r2Key = `hero-backgrounds/bg-${i + 1}.jpg`;
      await uploadToR2(r2Key, buffer, 'image/jpeg');
      result.images.push({ key: `hero.bg.${i}`, r2_key: r2Key, section: 'hero_bg' });
      console.log(`  ✓ ${r2Key}`);
    } catch (error) {
      result.errors.push(`Hero BG ${i}: ${error.message}`);
    }
  }

  // 2. Migrar menu pages
  console.log('📄 Migrando menu pages...');
  for (let i = 0; i < menuPagesJson.pages.length; i++) {
    try {
      const page = menuPagesJson.pages[i];
      const buffer = await downloadDriveFile(page.url);
      const r2Key = `menu-pages/page-${String(i + 1).padStart(2, '0')}.png`;
      await uploadToR2(r2Key, buffer, 'image/png');
      result.menu_pages.push({ title: page.title || `Página ${i + 1}`, r2_key: r2Key, order: i });
      console.log(`  ✓ ${r2Key}`);
    } catch (error) {
      result.errors.push(`Menu page ${i}: ${error.message}`);
    }
  }

  // 3. Migrar gallery fallback images (si existen)
  if (siteJson.gallery.fallbackImages?.length) {
    console.log('🖼️  Migrando gallery fallbacks...');
    for (let i = 0; i < siteJson.gallery.fallbackImages.length; i++) {
      try {
        const driveUrl = siteJson.gallery.fallbackImages[i];
        const buffer = await downloadDriveFile(driveUrl);
        const r2Key = `gallery/img-${nanoid(10)}.jpg`;
        await uploadToR2(r2Key, buffer, 'image/jpeg');
        result.images.push({ key: `gallery.${nanoid(6)}`, r2_key: r2Key, section: 'gallery' });
        console.log(`  ✓ ${r2Key}`);
      } catch (error) {
        result.errors.push(`Gallery ${i}: ${error.message}`);
      }
    }
  }

  return result;
}

async function seedD1(result: MigrationResult): Promise<void> {
  console.log('🌱 Seeding D1...');
  
  // Aquí se conectaría a D1 via Wrangler binding o API HTTP
  // Por ahora, generar SQL para ejecutar manualmente
  
  let sql = '-- Seed generado por migración\n\n';
  
  // Images
  for (const img of result.images) {
    sql += `INSERT INTO images (id, key, section, r2_key, visible, sort_order) VALUES ('${nanoid()}', '${img.key}', '${img.section}', '${img.r2_key}', 1, 0);\n`;
  }
  
  // Menu pages
  for (const page of result.menu_pages) {
    sql += `INSERT INTO menu_pages (id, title, r2_key, visible, sort_order) VALUES ('${nanoid()}', '${page.title}', '${page.r2_key}', 1, ${page.order});\n`;
  }
  
  // Text blocks (manual — requiere extraer de site.json)
  sql += `\n-- Text blocks (hero, story, etc.) — completar manualmente\n`;
  sql += `INSERT INTO text_blocks (id, key, section, body, visible, sort_order) VALUES ('${nanoid()}', 'hero.title', 'hero', '${siteJson.hero.title.replace(/'/g, "''")}', 1, 0);\n`;
  sql += `INSERT INTO text_blocks (id, key, section, body, visible, sort_order) VALUES ('${nanoid()}', 'hero.description', 'hero', '${siteJson.hero.description.replace(/'/g, "''")}', 1, 1);\n`;
  
  // Escribir a archivo
  const fs = require('fs');
  fs.writeFileSync('seed-d1.sql', sql);
  console.log('  ✓ seed-d1.sql generado');
}

// Ejecutar
migrate()
  .then(async (result) => {
    console.log('\n✅ Migración completada');
    console.log(`  Imágenes migradas: ${result.images.length}`);
    console.log(`  Páginas menú migradas: ${result.menu_pages.length}`);
    if (result.errors.length) {
      console.error(`  ⚠️  Errores: ${result.errors.length}`);
      result.errors.forEach(e => console.error(`    - ${e}`));
    }
    
    await seedD1(result);
  })
  .catch(error => {
    console.error('❌ Migración falló:', error);
    process.exit(1);
  });
```

---

## Apéndice C: Ejemplo validación Access JWT en Pages Function

```typescript
// functions/api/beers.ts
import { jwtVerify, importSPKI } from 'jose';

interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  ACCESS_AUD: string; // Audience del Access policy
  ACCESS_TEAM_DOMAIN: string; // ej: 'donfranco.cloudflareaccess.com'
}

async function validateAccessJWT(jwt: string, env: Env): Promise<boolean> {
  try {
    // Obtener Cloudflare Access public key
    const certsUrl = `https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
    const certsResponse = await fetch(certsUrl);
    const { keys } = await certsResponse.json();
    
    // Verificar JWT con key pública
    const publicKey = await importSPKI(keys[0].pem, 'RS256');
    const { payload } = await jwtVerify(jwt, publicKey, {
      audience: env.ACCESS_AUD,
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
    });
    
    // Verificar que payload.email existe (usuario autenticado)
    return !!payload.email;
  } catch (error) {
    console.error('JWT validation failed:', error);
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  // 🔒 Validar Access JWT
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt || !(await validateAccessJWT(jwt, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // ✅ Autorizado — procesar CRUD
  const body = await request.json();
  const { name, style, notes, image_id } = body;
  
  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO beers (id, name, style, notes, image_id, visible) VALUES (?, ?, ?, ?, ?, 1)'
  ).bind(id, name, style, notes, image_id).run();
  
  return Response.json({ id, name, style, notes, image_id, visible: 1 });
};
```

---

## Apéndice D: Notas P1 (importantes, no bloqueantes)

### Cascada category→items (UX)

- **Comportamiento público:** Si `category.visible=0`, sus items **no aparecen** aunque `item.visible=1`.
- **Comportamiento admin UI:**
  - Items dentro de categoría oculta se muestran con clase `.cascaded-hidden` (gris + tooltip "Categoría oculta").
  - Toggle individual de item sigue funcionando (permite pre-configurar visibilidad antes de mostrar categoría).

### Bulk operations

- **Menu pages:** Checkbox "Seleccionar todas" + botón "Ocultar seleccionadas" / "Mostrar seleccionadas".
- **Gallery:** Mismo patrón.
- **Mejora post-MVP:** Drag-and-drop para reordenar + cambiar visible en masa.

### Admin lists — items ocultos grises

- Todos los listados admin (beers, menu items, gallery images, etc.) aplican clase CSS:
  ```css
  .item-hidden {
    opacity: 0.5;
    background-color: #f9fafb;
  }
  .item-hidden::after {
    content: "Oculto";
    background-color: #fbbf24;
    color: #78350f;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    margin-left: 8px;
  }
  ```

### Validaciones (warnings amarillos)

- **Hero sin CTA visible:** "⚠️ Hero no tiene call-to-action visible — usuarios no tendrán botón para contactar."
- **Category sin items visibles:** "⚠️ Categoría 'Postres' no tiene items visibles — no se mostrará en menú digital."
- **Beer con placeholder forzado:** "ℹ️ Cerveza 'IPA' no tiene imagen visible — se mostrará con placeholder."

Warnings **no bloquean** publish, solo informan.

---

**Fin del plan v2 enmendado.**

Este plan incorpora TODAS las correcciones P0 de auditorías A y B, cierra decisiones abiertas con defaults razonados, y especifica implementación a nivel de DDL SQL, TypeScript y UX.

**Próximos pasos:**
1. Gabriel revisa y aprueba plan v2.
2. Iniciar implementación fase 1 (schema D1 + migración).
3. Auditorías de implementación en fases 2-3 si necesario.
