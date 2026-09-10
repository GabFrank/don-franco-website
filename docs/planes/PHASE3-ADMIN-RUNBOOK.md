# FASE 3: Admin UI - Runbook

**Fecha:** 2026-09-10  
**Estado:** Implementado  
**Rama:** `cursor/feat-admin-phase3-ui-fa73`  
**PR:** https://github.com/GabFrank/don-franco-website/pull/6

---

## 1. Resumen

Fase 3 implementa el panel de administración React para Don Franco, incluyendo:

- ✅ React SPA con Vite servida en `/admin`
- ✅ 7 módulos MVP: Textos, Menú, Cervezas, Galería, Reseñas, Contacto, Publicar
- ✅ UX de visibilidad: checkbox "Mostrar", cascada categorías→items, bulk operations
- ✅ Upload de imágenes a R2 con preview
- ✅ Pantalla Publicar con polling cada 10s hasta completar
- ✅ Paleta Brewery Ember (cream, charcoal, ember, craft)

**Stack:**
- Frontend: React 19 + React Router + TypeScript
- Build: Vite 8
- Consumo API: Fetch nativo + helpers auth (dev bypass o Cloudflare Access JWT)

---

## 2. Estructura del proyecto

```
/workspace
├── admin/                    # React SPA admin panel
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx    # Sidebar navigation + main content
│   │   │   └── Layout.css
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TextBlocks.tsx
│   │   │   ├── Menu.tsx
│   │   │   ├── Beers.tsx
│   │   │   ├── Gallery.tsx
│   │   │   ├── Reviews.tsx
│   │   │   ├── Contact.tsx
│   │   │   └── Publish.tsx
│   │   ├── types/
│   │   │   └── api.ts         # TypeScript tipos para API
│   │   ├── lib/
│   │   │   └── api.ts         # Cliente API con auth helpers
│   │   ├── styles/
│   │   │   └── global.css     # Paleta Brewery Ember + estilos globales
│   │   ├── App.tsx            # React Router setup
│   │   └── main.tsx           # Entry point React
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
├── src/                       # Astro sitio público
├── functions/                 # Pages Functions (APIs Fase 2)
├── public/
│   ├── admin/                 # Build output React SPA (generado)
│   └── _redirects             # Cloudflare Pages redirects (React Router)
├── package.json
└── docs/planes/
    ├── PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md
    ├── PHASE2-ADMIN-RUNBOOK.md
    └── PHASE3-ADMIN-RUNBOOK.md (este documento)
```

---

## 3. Desarrollo local

### 3.1. Instalar dependencias

```bash
npm install
```

Dependencias clave:
- `react`, `react-dom` (v19)
- `react-router-dom` (v7)
- `vite`, `@vitejs/plugin-react`
- TypeScript types

### 3.2. Iniciar dev server admin

**Opción A: Solo admin (desarrollo aislado)**

```bash
npm run dev:admin
```

- Corre en `http://localhost:5173/admin`
- Proxy a `http://localhost:8788` para `/api` y `/media`
- Hot reload React

**Opción B: Admin + Astro + Functions (stack completo)**

Terminal 1 (Astro + Pages Functions):
```bash
npm run dev
```

Terminal 2 (Admin dev):
```bash
npm run dev:admin
```

### 3.3. Autenticación en desarrollo

El admin requiere autenticación. En desarrollo, usa **dev bypass**:

1. Abre `http://localhost:5173/admin`
2. Abre DevTools > Application > Local Storage
3. Agrega:
   - Key: `ADMIN_DEV_BYPASS_SECRET`
   - Value: `mi-secret-local-123` (o el valor en `.env.local`)

**Nota:** En producción, Cloudflare Access maneja autenticación (ver § 4).

### 3.4. Testing endpoints API

El cliente API (`admin/src/lib/api.ts`) lee `ADMIN_DEV_BYPASS_SECRET` de localStorage y lo envía en headers.

Ejemplo manual:

```bash
curl http://localhost:8788/api/beers \
  -H "ADMIN_DEV_BYPASS_SECRET: mi-secret-local-123"
```

---

## 4. Build y deploy

### 4.1. Build producción

```bash
# Build completo (admin + sitio)
npm run build

# Solo admin
npm run build:admin
```

**Proceso:**

1. `npm run build:admin`:
   - Compila React SPA con Vite
   - Output: `public/admin/` (index.html + assets/)
   - Base path: `/admin/`

2. `astro build`:
   - Build SSG del sitio público
   - Incluye `public/admin/` en output final
   - Output: `dist/`

**Resultado:**

```
dist/
├── index.html           # Sitio público
├── _astro/              # Assets Astro
├── admin/
│   ├── index.html       # Admin SPA entry
│   └── assets/
│       ├── index-abc123.js
│       └── index-def456.css
└── _redirects           # React Router redirects
```

### 4.2. Deploy a Cloudflare Pages

**Automático (push a branch):**

```bash
git push -u origin cursor/feat-admin-phase3-ui-fa73
```

Cloudflare Pages detecta el push y ejecuta:

```bash
npm run build
```

**Preview URL:**

```
https://feat-admin-phase3-ui-fa73.don-franco-v2.pages.dev
```

**Acceder al admin:**

```
https://feat-admin-phase3-ui-fa73.don-franco-v2.pages.dev/admin
```

### 4.3. Configurar Cloudflare Access (producción)

El admin requiere Cloudflare Access JWT en producción (sin dev bypass).

**Pasos:**

1. **Crear aplicación Access** (ver PHASE2-ADMIN-RUNBOOK.md § 3.1)
   - Path: `*.pages.dev/admin*` o `donfrancorestaurante.com/admin*`
   - Policy: Allow emails específicos (ej: gabriel@...)

2. **Configurar env vars en Pages:**
   - Dashboard > Pages > don-franco-v2 > Settings > Environment variables
   - `ACCESS_AUD`: Audience Tag de Access
   - `ACCESS_TEAM_DOMAIN`: `your-team.cloudflareaccess.com`
   - `ENVIRONMENT`: `production`

3. **Testing:**
   - Visita `https://preview-url.pages.dev/admin`
   - Access redirige a login
   - Post-login, admin carga con JWT válido

**Nota:** Dev bypass NO funciona si `ENVIRONMENT=production` (por seguridad).

---

## 5. Módulos admin MVP

### 5.1. Dashboard (`/admin`)

- Grid de cards con enlaces rápidos a módulos
- Info sobre publicación pendiente

### 5.2. Textos (`/admin/textos`)

**Entidad:** `text_blocks`

**Funciones:**
- Listar bloques agrupados por sección (hero, story, footer)
- CRUD: crear, editar, soft/hard delete
- Toggle "Mostrar/Ocultar" (columna `visible`)
- Badge "Oculto" si `visible=0`

**UX visible:**
- Filas ocultas: clase `.item-hidden` (opacity 0.5)
- Badge amarillo "Oculto"

### 5.3. Menú (`/admin/menu`)

**Entidades:** `menu_categories`, `menu_items`, `menu_pages`

**Tabs:**
1. **Menú Digital:**
   - Categorías con items anidados
   - CRUD categorías + items
   - **Cascada:** Si `category.visible=0`, items dentro muestran ⚠️ tooltip "Categoría oculta"
   - Items con categoría oculta son grises (`.cascaded-hidden`)

2. **Carta PNG:**
   - Grid de páginas (imágenes R2)
   - Bulk operations: "Mostrar Todas" / "Ocultar Todas"
   - Preview imagen (`/media/{r2_key}`)

**UX visible:**
- Toggle "Mostrar/Ocultar" en categorías y items
- Warning amarillo si categoría oculta: "Todos los items serán invisibles"

### 5.4. Cervezas (`/admin/cervezas`)

**Entidad:** `beers` (con FK a `images`)

**Funciones:**
- Grid de cards con imagen + detalles
- Upload imagen: `api.r2.upload()` → crea `images` → asocia a `beers.image_id`
- Preview imagen con `/media/{r2_key}`
- Placeholder si `image_id` NULL

**UX visible:**
- Badge "Visible" / "Oculto"
- Toggle "Mostrar/Ocultar"

### 5.5. Galería (`/admin/galeria`)

**Entidad:** `gallery_images`

**Funciones:**
- Grid de fotos
- Upload directo: crea `gallery_images` con R2 key
- **Bulk operations:**
  - Checkbox selección múltiple
  - "Mostrar Seleccionadas" / "Ocultar Seleccionadas" / "Eliminar Seleccionadas"
  - "Seleccionar Todas" / "Deseleccionar Todas"

**UX visible:**
- Checkbox en cada card
- Contador "X seleccionada(s)"

### 5.6. Reseñas (`/admin/resenas`)

**Entidades:** `review_quotes`, `review_stats`

**Secciones:**
1. **Estadísticas (singleton):**
   - Rating promedio (0-5)
   - Total de reseñas
   - `block_visible`: oculta TODA la sección reseñas si `0`

2. **Citas:**
   - Lista de citas con autor
   - CRUD individual
   - Toggle "Mostrar/Ocultar"

**UX visible:**
- Badge "Sección visible/oculta" en stats
- Warning si `block_visible=0`: "Citas no se mostrarán aunque estén visibles"

### 5.7. Contacto (`/admin/contacto`)

**Entidad:** `contact_info` (singleton)

**Campos:**
- WhatsApp (con link a `wa.me`)
- Dirección
- Horarios (textarea, múltiples líneas)

**UX:**
- **NO tiene toggle "Mostrar"** (datos core, siempre visibles)
- Modo edición in-place
- Última actualización timestamp

### 5.8. Publicar (`/admin/publicar`)

**Entidad:** `publish_log`

**Funciones:**
- Botón "🚀 Publicar Cambios"
- Llama `POST /api/publish` → trigger webhook Pages deploy
- **Polling cada 10s:**
  - Consulta `GET /api/publish/{id}`
  - Muestra spinner + "Publicando... (1-2 min)"
  - Detiene polling cuando `status = 'completed' | 'failed'`
- Historial de publicaciones:
  - Fecha, usuario, estado, duración
  - Detalles webhook response (collapsible)

**UX:**
- Warning: "Cambios no se reflejan hasta publicar"
- Alerta éxito: "✓ Completado! Cambios visibles en sitio"
- Alerta error: "Publicación falló"
- Última publicación: timestamp + email

---

## 6. API client (`admin/src/lib/api.ts`)

**Estructura:**

```typescript
api.textBlocks.list(includeHidden, includeDeleted)
api.textBlocks.get(id)
api.textBlocks.create(data)
api.textBlocks.update(id, data)
api.textBlocks.delete(id, hard)

api.beers.*
api.menuCategories.*
api.menuItems.*
api.menuPages.*
api.galleryImages.*
api.reviewQuotes.*
api.reviewStats.get() / .update()
api.contactInfo.get() / .update()
api.settings.*
api.publish.trigger() / .getLog() / .getStatus(id)
api.r2.upload(file, folder)
api.public.getContent()
```

**Auth helpers:**

```typescript
function getAuthHeaders(): HeadersInit {
  const headers = { 'Content-Type': 'application/json' };
  
  // Dev bypass
  const devSecret = localStorage.getItem('ADMIN_DEV_BYPASS_SECRET');
  if (devSecret) {
    headers['ADMIN_DEV_BYPASS_SECRET'] = devSecret;
  }
  
  // Producción: Cloudflare Access JWT automático en header `Cf-Access-Jwt-Assertion`
  
  return headers;
}
```

**Nota:** En producción, el navegador envía JWT automáticamente (cookie de Access).

---

## 7. Paleta de colores Brewery Ember

**Variables CSS (`admin/src/styles/global.css`):**

```css
:root {
  --cream: #FAF3E8;      /* Fondo primario */
  --charcoal: #1A1614;   /* Sidebar + títulos */
  --ember: #E85D04;      /* Acento + links */
  --craft: #2F9E4F;      /* Success + "Mostrar" */
  --white: #FFFFFF;      /* Fondo cards */
}
```

**Uso:**

- Sidebar: `background: var(--charcoal)`, texto `var(--cream)`
- Botones primarios: `background: var(--ember)`
- Botones "Mostrar": `background: var(--craft)`
- Badge "Visible": verde craft, "Oculto": amarillo warning

---

## 8. React Router

**Rutas:**

```typescript
/ → Dashboard
/textos → TextBlocks
/menu → Menu
/cervezas → Beers
/galeria → Gallery
/resenas → Reviews
/contacto → Contact
/publicar → Publish
```

**Navegación:**
- Sidebar con íconos emoji
- Active state: borde izquierdo ember + fondo ligero

**Catch-all (`public/_redirects`):**

```
/admin/* /admin/index.html 200
```

Cloudflare Pages redirige todas las rutas `/admin/*` al SPA, permitiendo React Router manejar navegación client-side.

---

## 9. UX de visibilidad (transversal)

### 9.1. Toggle "Mostrar/Ocultar"

**Default:** Checkbox "Mostrar" marcado (visible=1)

**Comportamiento:**
- `visible=1` → Badge verde "Visible"
- `visible=0` → Badge amarillo "Oculto" + fila `.item-hidden` (opacity 0.5)

**Código:**

```typescript
const handleToggleVisible = async (item) => {
  await api.items.update(item.id, { visible: item.visible ? 0 : 1 });
  loadItems();
};
```

### 9.2. Cascada (categorías → items)

**Regla:**
- Si `category.visible=0`, sus items NO aparecen en sitio público aunque `item.visible=1`

**UX admin:**
- Items con categoría oculta: clase `.cascaded-hidden` (gris + cursiva)
- Tooltip: "Categoría oculta — item no será público"
- Warning en card de categoría: "⚠️ Categoría oculta - Todos los items serán invisibles"

### 9.3. Bulk operations

**Módulos:** Gallery, Menu Pages

**Funciones:**
- Checkbox selección múltiple
- Botones: "Mostrar Todas" / "Ocultar Todas" / "Eliminar Seleccionadas"

**Código:**

```typescript
const handleBulkVisible = async (visible: number) => {
  await Promise.all(
    selectedIds.map(id => api.items.update(id, { visible }))
  );
  loadItems();
};
```

### 9.4. Soft delete vs Hard delete

- **Soft delete:** `DELETE /api/items/:id` → set `deleted_at`
  - Confirmación: "¿Mover a papelera?"
  - Recuperable (no implementado en MVP, pero flag existe)

- **Hard delete:** `DELETE /api/items/:id?hard=true`
  - Confirmación: "⚠️ BORRADO PERMANENTE - No se puede recuperar. ¿Confirmar?"
  - Elimina fila de D1 + objeto R2 (si aplica)

**UX:**
- Botón "🗑️" → soft delete
- Menú contextual "Eliminar permanentemente" → hard delete (no implementado en cards, solo en modals)

---

## 10. Troubleshooting

### 10.1. Error: `Missing Cf-Access-Jwt-Assertion header`

**Causa:** Request sin JWT ni dev bypass.

**Solución local:**
1. Verifica `localStorage.getItem('ADMIN_DEV_BYPASS_SECRET')`
2. Debe coincidir con `.env.local` → `ADMIN_DEV_BYPASS_SECRET`

**Solución producción:**
1. Verifica Access está configurado para `/admin*`
2. Re-login en Cloudflare Access
3. Verifica cookie `CF_Authorization` existe en DevTools

### 10.2. Admin no carga (404 en `/admin`)

**Causa:** Build no generó `public/admin/index.html`

**Solución:**
```bash
npm run build:admin
ls -la public/admin/
```

Debe mostrar `index.html` + `assets/`.

### 10.3. React Router no funciona (404 en `/admin/textos`)

**Causa:** `_redirects` no aplicado.

**Solución:**
1. Verifica `public/_redirects` existe
2. Contenido: `/admin/* /admin/index.html 200`
3. Re-deploy a Pages

### 10.4. Imágenes no cargan (`/media/*` 404)

**Causa:** Proxy no configurado o R2 bucket vacío.

**Solución local:**
1. Verifica `admin/vite.config.ts` tiene proxy `/media` → `http://localhost:8788`
2. Verifica Pages Functions `functions/media/[key].ts` existe (Fase 2)

**Solución producción:**
1. Verifica R2 bucket binding en Pages > Settings > Functions
2. Sube imágenes de prueba a R2

### 10.5. Polling no detiene (publicación completa pero spinner infinito)

**Causa:** `publish_log.status` no actualizó a `completed`.

**Solución:**
1. Verifica webhook Pages configurado (PHASE2 § 4)
2. Revisa logs en `api.publish.getLog()` → `webhook_response`
3. Manualmente actualizar status en D1:
   ```sql
   UPDATE publish_log SET status = 'completed', completed_at = unixepoch() WHERE id = '...';
   ```

---

## 11. Próximos pasos (post-MVP)

- [ ] Integrar sitio Astro v2 con `/api/public/content` (Fase 4)
- [ ] Testing E2E: crear cerveza → publicar → verificar en sitio
- [ ] Drag-and-drop reordering (ej: cervezas, páginas menú)
- [ ] Preview antes de publish (Pages preview branch)
- [ ] Rollback a versión anterior de contenido
- [ ] Soft-delete recovery UI ("Papelera")

---

## 12. Recursos

- **Código admin:** `admin/src/`
- **API client:** `admin/src/lib/api.ts`
- **Tipos:** `admin/src/types/api.ts`
- **Estilos:** `admin/src/styles/global.css`
- **Plan completo:** `docs/planes/PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md`
- **API backend:** `docs/planes/PHASE2-ADMIN-RUNBOOK.md`
- **Vite docs:** https://vitejs.dev/
- **React Router docs:** https://reactrouter.com/

---

**Fin del runbook Fase 3.**
