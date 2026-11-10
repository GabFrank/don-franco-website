# PHASE 4 ADMIN RUNBOOK: Integración Astro v2 + API Pública

**Estado:** ✅ Implementado  
**Fecha:** 2026-09-10  
**Branch:** `cursor/feat-admin-phase4-integration-b8d9`  
**Pre-requisitos:** Phase 2 (API D1) y Phase 3 (Admin UI) completadas  

---

## Resumen

Phase 4 integra el sitio Astro v2 con la API pública de contenido (`/api/public/content`) implementada en Phase 2. El sitio ahora:

1. **Fetch en build-time** desde `/api/public/content` (contenido filtrado `visible=1 AND deleted_at IS NULL`)
2. **Fallback a JSON** si la API no está disponible (permite builds sin D1 running)
3. **Respeta cascada de visibilidad** para menú (categoría AND item deben ser visibles)
4. **Workflow de publicación** configurable via Deploy Hook de Cloudflare Pages

---

## Arquitectura de Datos

### Flujo de contenido

```
┌─────────────────────────────────────────────────────────────┐
│  Admin UI (Phase 3)                                         │
│  - Editor modifica contenido en D1                          │
│  - Marca visible=1 o visible=0                              │
│  - Hace clic en "Publicar"                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/publish                                          │
│  - Crea entrada en publish_log                              │
│  - Llama CF_PAGES_DEPLOY_HOOK_URL                          │
│  - Retorna inmediatamente (status: building)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Pages Build                                     │
│  - npm run build                                            │
│  - astro build llama fetchPublicContent()                   │
│  - fetchPublicContent() → GET /api/public/content           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /api/public/content                                    │
│  - Query D1: WHERE visible=1 AND deleted_at IS NULL         │
│  - Aplica cascada menú (category AND item)                  │
│  - Retorna JSON con contenido público                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Astro Static Site                                          │
│  - Pre-renderizado con contenido filtrado                   │
│  - Deployed a Cloudflare Pages                              │
└─────────────────────────────────────────────────────────────┘
```

### Fallback JSON

Si `PUBLIC_CONTENT_API_URL` no está disponible o retorna error:

```typescript
// src/lib/content-api.ts
export async function fetchPublicContent(): Promise<PublicContent> {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('[content-api] API fetch failed, falling back to JSON');
  }
  
  // Fallback: construir desde src/content/*.json
  return buildFallbackContent();
}
```

**Ventajas:**
- ✅ Build funciona localmente sin D1
- ✅ Preview branches pueden usar JSON si D1 no está accesible
- ✅ Degrada gracefully en caso de error de API

---

## Componentes actualizados (Phase 4)

Todos los componentes Astro ahora usan `fetchPublicContent()` en lugar de importar JSON directamente:

| Componente | Contenido desde API | Fallback JSON |
|------------|---------------------|---------------|
| `Hero.astro` | `textBlocks` (hero.*), `images` (hero_bg) | `site.json` hero |
| `StorySection.astro` | `textBlocks` (story.paragraph.*, story.chip.*) | `site.json` story |
| `BeerStrip.astro` | `beers` + `images` (beer) | `site.json` beers |
| `MenuSection.astro` | `menu.categories`, `menu.items`, `menu.pages` | `menu-digital.json`, `menu-pages.json` |
| `GallerySection.astro` | `gallery` (gallery_images) | `site.json` gallery.fallbackImages |
| `ReviewsSection.astro` | `reviews.stats`, `reviews.quotes` | `site.json` reviews |
| `ContactSection.astro` | `contact` (contact_info) | `site.json` contact |
| `WhatsAppFloat.astro` | `contact.whatsapp` | `site.json` contact.whatsapp |
| `StickyCtaBar.astro` | `contact.whatsapp` | `site.json` contact.whatsapp |
| `Footer.astro` | `contact` (address, hours, whatsapp) | `site.json` contact + footer |

---

## Variables de entorno

### `.env` local (desarrollo)

```bash
# Content API URL (apunta a Functions local)
PUBLIC_CONTENT_API_URL=http://localhost:8788/api/public/content

# Google APIs (opcional, solo si usas Drive/Places)
GOOGLE_DRIVE_API_KEY=tu_api_key
GOOGLE_PLACES_API_KEY=tu_api_key

# Deploy hook (no necesario en dev)
# CF_PAGES_DEPLOY_HOOK_URL=
```

### Cloudflare Pages Environment Variables (producción)

**En Cloudflare Dashboard → Pages → don-franco-v2 → Settings → Environment variables:**

| Variable | Valor | Scope |
|----------|-------|-------|
| `PUBLIC_CONTENT_API_URL` | `https://don-franco-v2.pages.dev/api/public/content` | Production |
| `CF_PAGES_DEPLOY_HOOK_URL` | `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/{hook_id}` | Production |
| `GOOGLE_DRIVE_API_KEY` | (opcional) | Production |
| `GOOGLE_PLACES_API_KEY` | (opcional) | Production |

**⚠️ IMPORTANTE:** `CF_PAGES_DEPLOY_HOOK_URL` es requerido para que el botón "Publicar" en Admin UI funcione. Sin este webhook, el admin creará entradas en `publish_log` pero no triggereará el rebuild.

### Cómo crear Deploy Hook

1. Ir a **Cloudflare Pages → don-franco-v2 → Settings → Builds & deployments**
2. Scroll a **Build hooks**
3. Clic **Create deploy hook**
4. Nombre: `admin-publish-trigger`
5. Branch: `main` (o la branch de producción)
6. Copiar URL generada (ej: `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abc123...`)
7. Agregar como variable de entorno `CF_PAGES_DEPLOY_HOOK_URL`

---

## Workflow de publicación

### 1. Admin UI: Modificar contenido

- Gabriel entra a `/admin` (protegido por Cloudflare Access)
- Edita cerveza "IPA" → cambia descripción
- **NO** hace clic en "Publicar" todavía → cambio está en D1 pero sitio público aún no lo ve

### 2. Admin UI: Publicar

- Gabriel hace clic en **"Publicar"**
- Admin UI → `POST /api/publish`
- Respuesta:
  ```json
  {
    "id": "pub-xyz",
    "user_email": "gabriel@donfranco.com",
    "status": "building",
    "message": "Publicación iniciada. El deploy puede tardar 1-2 minutos.",
    "created_at": 1694350800
  }
  ```

### 3. Backend: Trigger Deploy

- `/api/publish` llama `CF_PAGES_DEPLOY_HOOK_URL`
- Cloudflare Pages inicia nuevo deploy:
  1. `git pull` (último commit de branch main)
  2. `npm install`
  3. `npm run build` → `astro build`
  
### 4. Build-time: Fetch contenido

Durante `astro build`:

```typescript
// Cada componente Astro hace:
const content = await fetchPublicContent();

// fetchPublicContent() internamente:
const response = await fetch('https://don-franco-v2.pages.dev/api/public/content');
const data = await response.json();
```

**⚠️ Nota:** La API `/api/public/content` debe ser accesible **durante el build**. Si el sitio está en preview/draft, asegurarse de que la Function esté deployed en esa branch.

### 5. Deploy completo

- Pages termina build → actualiza CDN
- Sitio público muestra cambio de cerveza "IPA"
- Tiempo total: **1-2 minutos** desde clic en "Publicar"

### 6. Admin UI: Polling (opcional)

Admin UI puede hacer polling para mostrar status:

```javascript
async function pollPublishStatus(publishId) {
  const response = await fetch(`/api/publish-status?id=${publishId}`);
  const { status } = await response.json();
  
  if (status === 'completed') {
    alert('¡Publicación completada! 🎉');
  } else if (status === 'failed') {
    alert('Error en publicación. Ver logs.');
  } else {
    // Retry en 10s
    setTimeout(() => pollPublishStatus(publishId), 10000);
  }
}
```

**Nota:** Phase 4 MVP **no** implementa `/api/publish-status` automático. El admin muestra "Publicación iniciada..." y el usuario debe esperar 1-2 min y recargar la página pública.

---

## Cascada de visibilidad (Menú)

### Regla implementada

Un **item de menú** aparece en el sitio público solo si:

```sql
item.visible = 1 
  AND item.deleted_at IS NULL
  AND category.visible = 1 
  AND category.deleted_at IS NULL
```

### Ejemplo

**Escenario:**

| Categoría | visible | Items | item.visible | Resultado público |
|-----------|---------|-------|--------------|-------------------|
| Postres | 1 | Flan | 1 | ✅ Visible |
| Postres | 1 | Helado | 0 | ❌ Oculto (item.visible=0) |
| Postres | 0 | Flan | 1 | ❌ Oculto (category.visible=0) |

**Implementación:**

```typescript
// src/lib/content-api.ts - buildFallbackContent()
const categories = showDigital 
  ? content.menu.categories.map(cat => {
      const categoryItems = content.menu.items
        .filter(item => item.category_id === cat.id) // Cascada implícita
        .map(item => ({ ... }));
      return { name: cat.title, items: categoryItems };
    })
  : [];
```

```sql
-- functions/api/public/content.ts
SELECT mi.*, mc.title as category_title
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.visible = 1 AND mi.deleted_at IS NULL
  AND mc.visible = 1 AND mc.deleted_at IS NULL
ORDER BY mi.category_id, mi.sort_order
```

---

## R2 Media URLs

### Función helper

```typescript
// src/lib/content-api.ts
export function getR2ImageUrl(r2Key: string | null | undefined): string {
  if (!r2Key) return '';
  return `/media/${r2Key}`;
}
```

### MVP: Media proxy

**Opción A (MVP simple):** R2 bucket público + presigned URLs (TTL 24h)

- Ventaja: Sin Worker proxy
- Desventaja: URLs de imágenes con `visible=0` pueden filtrarse si alguien las guardó

**Opción B (segura):** Worker proxy `/media/{r2_key}` que valida `visible=1`

```typescript
// functions/media/[key].ts
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const r2Key = params.key as string;
  
  // Validar que el objeto pertenece a contenido visible
  const image = await env.DB
    .prepare('SELECT * FROM images WHERE r2_key = ? AND visible = 1 AND deleted_at IS NULL')
    .bind(r2Key)
    .first();
  
  if (!image) {
    return new Response('Not Found', { status: 404 });
  }
  
  // Fetch desde R2
  const object = await env.R2_BUCKET.get(r2Key);
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
```

**Phase 4 MVP usa Opción A** (URLs directas Drive o R2 presigned). Opción B es mejora post-MVP.

---

## Validaciones pre-build

### Requerimientos mínimos

Para que `npm run build` tenga éxito:

1. **API accesible:** `PUBLIC_CONTENT_API_URL` debe responder en build-time
   - Si no está configurada → usa fallback JSON (warning en console)
   - Si está configurada pero falla → usa fallback JSON (warning en console)

2. **Contenido mínimo visible:**
   - Al menos 1 `text_block` en `hero` con `visible=1`
   - Al menos 1 `beer` con `visible=1` (si beers section existe)
   - Al menos 1 `contact_info` row

3. **Sin errores TypeScript:**
   - Interfaces en `content-api.ts` coinciden con estructura de `/api/public/content`

### Prueba local

```bash
# Terminal 1: Correr Functions local (Phase 2 D1)
cd /workspace
npm run dev  # O wrangler pages dev

# Terminal 2: Build Astro
cd /workspace
export PUBLIC_CONTENT_API_URL=http://localhost:8788/api/public/content
npm run build

# Verificar salida:
# [content-api] ✓ Fetched from API: http://localhost:8788/api/public/content
# ✓ Built in 4.2s
```

Si ves `[content-api] Using JSON fallback` → la API no respondió, pero el build continuó con JSON estático.

---

## Troubleshooting

### Error: "fetch failed" durante build

**Síntoma:**
```
[content-api] API fetch failed, falling back to JSON: FetchError
```

**Causa:** `PUBLIC_CONTENT_API_URL` no está accesible desde el build environment.

**Solución:**
1. Verificar que Pages Function `/api/public/content` está deployed en la branch que Pages está building
2. Si estás en preview branch, asegurarse que Functions también están en esa branch
3. En Cloudflare Pages → Settings → Functions, verificar que Functions estén habilitadas

**Workaround:** Dejar que fallback JSON funcione. El build tendrá éxito pero usará contenido hardcodeado en `src/content/*.json`.

### Error: "TypeError: Cannot read property 'beers'"

**Síntoma:**
```
TypeError: Cannot read property 'beers' of undefined
  at BeerStrip.astro:8:24
```

**Causa:** Estructura de `PublicContent` no coincide con lo que retorna `/api/public/content`.

**Solución:**
1. Verificar que `/api/public/content` retorna estructura esperada:
   ```typescript
   {
     textBlocks: [...],
     images: [...],
     beers: [...],
     menu: { categories, items, pages },
     gallery: [...],
     reviews: { stats, quotes },
     contact: {...},
     settings: {...}
   }
   ```

2. Verificar interfaces en `src/lib/content-api.ts` coinciden con respuesta de API

### Admin "Publicar" no rebuilda sitio

**Síntoma:** Admin muestra "Publicación iniciada" pero el sitio público no se actualiza después de 5 minutos.

**Causa:** `CF_PAGES_DEPLOY_HOOK_URL` no configurado o inválido.

**Diagnóstico:**
1. Admin → POST `/api/publish` → Ver respuesta:
   ```json
   {
     "message": "Entrada de publicación creada, pero CF_PAGES_DEPLOY_HOOK_URL no está configurado."
   }
   ```

2. Verificar en D1 `publish_log`:
   ```sql
   SELECT * FROM publish_log ORDER BY created_at DESC LIMIT 1;
   ```
   - Si `webhook_response` es `NULL` → webhook no se llamó
   - Si `webhook_response` tiene error → webhook URL inválido

**Solución:**
1. Crear Deploy Hook en Cloudflare Pages (ver sección "Cómo crear Deploy Hook")
2. Agregar `CF_PAGES_DEPLOY_HOOK_URL` como variable de entorno en Pages
3. Re-deploy Functions (Pages Functions leen variables al deploy, no en runtime)

### Build funciona en local pero falla en Pages

**Síntoma:**
```
npm run build
✓ Built in 4.2s  (local)

Pages deploy:
[error] Build failed: Module not found: 'content-api'
```

**Causa:** Path de import incorrecto o archivo no commiteado.

**Solución:**
1. Verificar que `src/lib/content-api.ts` está commiteado:
   ```bash
   git status
   git add src/lib/content-api.ts
   git commit -m "Add content-api helper"
   git push
   ```

2. Verificar imports usan paths relativos correctos:
   ```typescript
   import { fetchPublicContent } from '../lib/content-api';
   // ✅ Correcto (desde src/components/*.astro)
   
   import { fetchPublicContent } from './lib/content-api';
   // ❌ Incorrecto si estás en src/components/
   ```

---

## Testing checklist

### Pre-merge validations

- [ ] `npm run build` pasa sin errores
- [ ] Build con `PUBLIC_CONTENT_API_URL` configurado usa API
- [ ] Build sin `PUBLIC_CONTENT_API_URL` usa JSON fallback
- [ ] Sitio local (`npm run preview`) muestra contenido correcto
- [ ] Hero muestra title/description desde API
- [ ] Beers strip muestra cervezas con imágenes
- [ ] Menú digital respeta cascada (category.visible AND item.visible)
- [ ] Galería muestra fotos
- [ ] Reviews muestra rating + quotes
- [ ] Contact muestra whatsapp/dirección/horarios
- [ ] WhatsApp float usa número desde API
- [ ] Footer muestra datos de contacto

### Post-deploy validations (en preview branch)

- [ ] Admin UI `/admin` accesible con Cloudflare Access
- [ ] Admin puede editar cerveza → cambio se guarda en D1
- [ ] Admin hace clic "Publicar" → `publish_log` registra entrada
- [ ] Deploy Hook se triggeró (verificar en Pages dashboard → Deployments)
- [ ] Después de 1-2 min, sitio público muestra cambio
- [ ] Ocultar categoría menú → items de esa categoría no aparecen
- [ ] Ocultar cerveza → card no aparece en BeerStrip
- [ ] Mostrar cerveza previamente oculta → reaparece tras rebuild

---

## Configuración de rutas Admin SPA

### Estructura de archivos

El panel de administración es una Single Page Application (SPA) de React que vive en `/admin` y se construye separadamente del sitio público Astro.

```
/workspace/
├── admin/
│   ├── src/
│   │   ├── main.tsx               # Entry point con basename="/admin"
│   │   ├── App.tsx                # React Router routes
│   │   └── components/Layout.tsx  # Sidebar responsive
│   ├── vite.config.ts             # base: '/admin/', outDir: '../public/admin'
│   ├── copy-routes.js             # Post-build: copia index.html a subdirectorios
│   └── index.html                 # Template HTML
├── public/
│   ├── _redirects                 # Cloudflare Pages SPA fallback
│   └── _routes.json               # Cloudflare Pages: solo Functions
└── dist/                          # Output after build
    ├── admin/
    │   ├── index.html             # SPA root
    │   ├── textos/index.html      # ⚠️ Generado por copy-routes.js
    │   ├── menu/index.html        # ⚠️ Generado por copy-routes.js
    │   ├── cervezas/index.html    # ⚠️ Generado por copy-routes.js
    │   └── ...                    # Uno por cada ruta SPA
    ├── _redirects
    └── _routes.json
```

### Configuración de enrutamiento

**1. Vite config (`admin/vite.config.ts`)**

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/admin/',                  // Base path para assets
  build: {
    outDir: '../public/admin',      // Output a public/admin
    emptyOutDir: true,
  },
});
```

**2. React Router (`admin/src/main.tsx`)**

```typescript
<BrowserRouter basename="/admin">
  <App />
</BrowserRouter>
```

**3. Cloudflare Pages routes (`public/_routes.json`)**

⚠️ **CRÍTICO:** `_routes.json` debe incluir **SOLO** las rutas de Functions, no `/*`:

```json
{
  "version": 1,
  "include": [
    "/api/*",
    "/media/*"
  ],
  "exclude": []
}
```

**¿Por qué?** Si incluyes `"/*"`, Cloudflare Pages rompe los rewrites del SPA y sirve 404s en navegación directa.

**4. Cloudflare Pages redirects (`public/_redirects`)**

```
# Fallback SPA para navegación client-side
/admin/* /admin/index.html 200
```

**5. Build step: copiar index.html a subdirectorios (`admin/copy-routes.js`)**

⚠️ **ESENCIAL:** `_redirects` solo funciona para navegación client-side en algunos contextos de CF Pages. Para garantizar que navegación directa a `/admin/textos` funcione, copiamos `index.html` a cada subdirectorio:

```javascript
// admin/copy-routes.js
const ADMIN_ROUTES = [
  'textos', 'menu', 'cervezas', 'galeria', 
  'resenas', 'contacto', 'publicar'
];

ADMIN_ROUTES.forEach(route => {
  const routeDir = join(outDir, route);
  mkdirSync(routeDir, { recursive: true });
  copyFileSync(sourceIndexPath, join(routeDir, 'index.html'));
});
```

Se ejecuta automáticamente como parte de `npm run build:admin` en `package.json`:

```json
{
  "scripts": {
    "build:admin": "cd admin && vite build && node copy-routes.js"
  }
}
```

### Rutas disponibles

Todas estas rutas deben funcionar correctamente:

- `/admin/` - Dashboard
- `/admin/textos` - Bloques de texto
- `/admin/menu` - Menú digital y carta PNG
- `/admin/cervezas` - Gestión de cervezas
- `/admin/galeria` - Galería de imágenes
- `/admin/resenas` - Reseñas
- `/admin/contacto` - Información de contacto
- `/admin/publicar` - Panel de publicación

**Verificación post-build:**

```bash
npm run build

# Debe producir:
# dist/admin/index.html          ✅
# dist/admin/textos/index.html   ✅
# dist/admin/menu/index.html     ✅
# dist/admin/cervezas/index.html ✅
# ... (uno por cada ruta)
# dist/_routes.json              ✅ (solo /api/*, /media/*)
# dist/_redirects                ✅ (/admin/* → /admin/index.html 200)
```

### Diseño responsive

**Desktop (≥1280px):**
- Sidebar fijo de 250px
- Contenido principal con margen izquierdo

**Tablet (768px - 1024px):**
- Hamburger menu (☰) en esquina superior izquierda
- Sidebar oculto por defecto, se desliza desde la izquierda al hacer clic
- Overlay semi-transparente cuando sidebar está abierto

**Mobile (≤767px):**
- Hamburger menu con botón de 48px (touch target)
- Sidebar en ancho completo cuando está abierto
- Tablas con scroll horizontal si es necesario
- Botones modales apilados verticalmente
- Touch targets mínimos de 44px en todos los controles

### Troubleshooting

**Problema:** Rutas como `/admin/textos` muestran el landing page público en vez del admin

**Causa 1:** `_routes.json` tiene `include: ["/*"]` en vez de solo Functions

**Solución:**
1. Verificar `public/_routes.json`:
   ```json
   {
     "version": 1,
     "include": ["/api/*", "/media/*"],
     "exclude": []
   }
   ```
2. Rebuildar: `npm run build`

**Causa 2:** `copy-routes.js` no se ejecutó o falló

**Solución:**
1. Verificar que `dist/admin/textos/index.html` existe:
   ```bash
   ls -la dist/admin/*/index.html
   ```
2. Si faltan, ejecutar manualmente:
   ```bash
   cd admin && node copy-routes.js
   ```

**Problema:** Assets del admin no cargan (CSS/JS 404)

**Causa:** El `base` de Vite no coincide con el `basename` de React Router

**Solución:**
1. Verificar `admin/vite.config.ts`: `base: '/admin/'` (con trailing slash)
2. Verificar `admin/src/main.tsx`: `basename="/admin"` (sin trailing slash)
3. Ambos deben apuntar a `/admin`

**Problema:** Build falla con "Cannot find module 'copy-routes.js'"

**Causa:** El script se ejecuta desde el directorio `admin/` pero Node no lo encuentra

**Solución:**
1. Verificar que `admin/copy-routes.js` existe
2. Verificar que tiene permisos de lectura: `chmod +r admin/copy-routes.js`
3. El script se ejecuta desde `package.json` como: `cd admin && node copy-routes.js`

**Problema:** Sidebar ocupa toda la pantalla en mobile

**Causa:** CSS responsive no aplicado correctamente

**Solución:**
1. Verificar que `admin/src/components/Layout.tsx` tiene el state `isMobileMenuOpen`
2. Verificar que `admin/src/components/Layout.css` tiene los media queries
3. Reconstruir: `npm run build:admin`

---

## Referencias

- **Phase 2 Runbook:** `docs/planes/PHASE2-ADMIN-RUNBOOK.md` (API `/api/public/content`)
- **Phase 3 Runbook:** `docs/planes/PHASE3-ADMIN-RUNBOOK.md` (Admin UI)
- **Plan v2 completo:** `docs/planes/PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md` (Fase 4 § línea 180-200)
- **Content API source:** `src/lib/content-api.ts`
- **Public API endpoint:** `functions/api/public/content.ts`
- **Publish endpoint:** `functions/api/publish.ts`

---

## Next Steps (Post-Phase 4)

### Phase 5: QA + documentación

- Testing exhaustivo de todos los casos de `visible` (ver Plan v2 § Fase 5)
- Documentación de usuario "Cómo publicar cambios"
- Video tutorial para Gabriel

### Phase 6: Cutover producción

- Backup legacy site
- Configurar dominio `donfrancorestaurante.com` → Pages
- Monitoreo primeros 7 días
- **⚠️ Solo después de aprobación explícita de Gabriel**

### Mejoras post-MVP

- [ ] `/api/publish-status` con polling en Admin UI
- [ ] Worker proxy `/media/{r2_key}` con validación `visible=1`
- [ ] Preview URL antes de publish a producción (Pages preview branch separado)
- [ ] Rollback de publicaciones (restore versión anterior desde `publish_log`)

---

**Fin del runbook Phase 4.**
