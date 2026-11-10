# FASE 2: Admin API - Runbook

**Fecha:** 2026-09-10  
**Estado:** Implementado - Pendiente provisión recursos Cloudflare  
**Rama:** `cursor/feat-admin-phase2-api-d8e0`

---

## 1. Resumen

Fase 2 implementa la API backend del panel admin de Don Franco, incluyendo:

- ✅ Endpoints CRUD autenticados para todas las entidades D1
- ✅ Endpoint público `/api/public/content` (sin auth, solo visible=1)
- ✅ Endpoint `/api/publish` con integración a deploy hook
- ✅ Helpers R2 para upload y proxy de media
- ✅ Validación Cloudflare Access JWT + dev bypass para testing local

**NO incluye:** UI React/Vue del admin (eso es Fase 3).

---

## 2. Endpoints implementados

### 2.1. Endpoints autenticados (requieren Cloudflare Access JWT)

Todos los endpoints bajo `/api/*` (excepto `/api/public/*`) validan el header `Cf-Access-Jwt-Assertion`.

| Endpoint | Métodos | Descripción |
|----------|---------|-------------|
| `/api/text-blocks` | GET, POST, PUT, DELETE | Bloques de texto (hero, story, chips) |
| `/api/images` | GET, POST, PUT, DELETE | Metadatos de imágenes en R2 |
| `/api/beers` | GET, POST, PUT, DELETE | Cervezas (con FK a images) |
| `/api/menu-categories` | GET, POST, PUT, DELETE | Categorías del menú digital |
| `/api/menu-items` | GET, POST, PUT, DELETE | Items del menú digital |
| `/api/menu-pages` | GET, POST, PUT, DELETE | Páginas PNG de carta física |
| `/api/gallery-images` | GET, POST, PUT, DELETE | Fotos de galería |
| `/api/review-quotes` | GET, POST, PUT, DELETE | Citas de reseñas |
| `/api/review-stats` | GET, PUT | Rating agregado + block_visible (singleton) |
| `/api/contact-info` | GET, PUT | WhatsApp, dirección, horarios (singleton) |
| `/api/settings` | GET, PUT, DELETE | Key-value store de configuración |
| `/api/publish` | GET, POST | Log de publicaciones + trigger deploy |
| `/api/r2/upload` | POST | Upload directo a R2 (multipart form) |
| `/api/r2/upload-url` | POST | Generar presigned URL (placeholder MVP) |

### 2.2. Endpoints públicos (sin autenticación)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/public/content` | GET | Todo el contenido del sitio con `visible=1 AND deleted_at IS NULL`. Incluye cascada menú (category Y item visibles). |
| `/media/:key` | GET | Proxy R2 - sirve archivos desde bucket privado |

### 2.3. Parámetros comunes

**Query strings (GET):**
- `?includeHidden=true` - Incluir items con `visible=0`
- `?includeDeleted=true` - Incluir items con `deleted_at IS NOT NULL`
- `?section=hero` - Filtrar por sección (text-blocks, images)
- `?category_id=xyz` - Filtrar menu-items por categoría

**Soft delete (DELETE):**
- `DELETE /api/beers/:id` - Soft delete (set `deleted_at`)
- `DELETE /api/beers/:id?hard=true` - Hard delete permanente

---

## 3. Configuración Cloudflare Access

### 3.1. Crear aplicación Access

1. **Cloudflare Dashboard** → **Zero Trust** → **Access** → **Applications** → **Add an application**
2. Seleccionar **Self-hosted**
3. Configurar:
   - **Application name:** `Don Franco Admin`
   - **Subdomain/path:** `donfrancorestaurante.com/admin` (o `don-franco-v2.pages.dev/admin` para preview)
   - **Session Duration:** 24 hours
4. **Add a policy:**
   - **Policy name:** `Admin Access`
   - **Action:** Allow
   - **Include:** Emails → `gabriel@donfrancorestaurante.com` (ajustar según usuarios)
5. Guardar aplicación
6. Copiar **Audience Tag** (ej: `abc123def456...`) y **Team Domain** (ej: `donfranco.cloudflareaccess.com`)

### 3.2. Configurar variables de entorno

#### En desarrollo local (`.env.local`)

```bash
# Copiar .env.example a .env.local
cp .env.example .env.local

# Editar .env.local:
ACCESS_AUD=abc123def456...  # Audience Tag de Access
ACCESS_TEAM_DOMAIN=donfranco.cloudflareaccess.com
ENVIRONMENT=development
ADMIN_DEV_BYPASS_SECRET=mi-secret-local-123
```

#### En Cloudflare Pages (producción)

1. **Cloudflare Dashboard** → **Pages** → **don-franco-v2** → **Settings** → **Environment variables**
2. Agregar variables (Tab **Production** y **Preview**):

| Variable | Valor | Nota |
|----------|-------|------|
| `ACCESS_AUD` | `abc123def456...` | Audience Tag de Access |
| `ACCESS_TEAM_DOMAIN` | `donfranco.cloudflareaccess.com` | Team domain |
| `ENVIRONMENT` | `production` | NO incluir en preview si se quiere dev bypass |
| `ADMIN_DEV_BYPASS_SECRET` | (vacío en prod) | Solo para preview/local testing |
| `CF_PAGES_DEPLOY_HOOK_URL` | `https://api.cloudflare.com/...` | Ver sección 4 |

3. **Bindings:** Asegurar que `DB` (D1) y `R2_BUCKET` están configurados en **Settings** → **Functions**

---

## 4. Configurar Deploy Hook (botón "Publicar")

### 4.1. Crear deploy hook

1. **Cloudflare Dashboard** → **Pages** → **don-franco-v2** → **Settings** → **Builds & deployments**
2. Scroll hasta **Deploy hooks** → **Create deploy hook**
3. Configurar:
   - **Deploy hook name:** `Admin Publish`
   - **Branch to build:** `cursor/feat-v2-greenfield-8e75` (o `main` cuando esté listo)
4. Copiar URL generada (ej: `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/xyz123...`)

### 4.2. Agregar a variables de entorno

```bash
# En .env.local (local)
CF_PAGES_DEPLOY_HOOK_URL=https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/xyz123...

# En Cloudflare Pages > Settings > Environment variables (prod)
CF_PAGES_DEPLOY_HOOK_URL = https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/xyz123...
```

### 4.3. Testing deploy hook

```bash
# Trigger manual desde CLI
curl -X POST https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/xyz123...

# Trigger desde admin API (requiere auth)
curl -X POST https://don-franco-v2.pages.dev/api/publish \
  -H "Cf-Access-Jwt-Assertion: <jwt-token>" \
  -H "Content-Type: application/json"
```

---

## 5. Testing local (dev bypass)

Para probar endpoints sin configurar Cloudflare Access completo:

### 5.1. Activar dev bypass

En `.env.local`:

```bash
ENVIRONMENT=development
ADMIN_DEV_BYPASS_SECRET=mi-secret-super-seguro-123
```

### 5.2. Hacer requests con bypass

```bash
# Ejemplo: Crear cerveza
curl -X POST http://localhost:8788/api/beers \
  -H "Content-Type: application/json" \
  -H "ADMIN_DEV_BYPASS_SECRET: mi-secret-super-seguro-123" \
  -d '{
    "name": "IPA Experimental",
    "style": "IPA",
    "notes": "Cítrico y amargo",
    "visible": 1
  }'

# Ejemplo: Listar cervezas (incluir ocultas)
curl "http://localhost:8788/api/beers?includeHidden=true"

# Ejemplo: Soft delete
curl -X DELETE http://localhost:8788/api/beers/beer123 \
  -H "ADMIN_DEV_BYPASS_SECRET: mi-secret-super-seguro-123"

# Ejemplo: Hard delete
curl -X DELETE "http://localhost:8788/api/beers/beer123?hard=true" \
  -H "ADMIN_DEV_BYPASS_SECRET: mi-secret-super-seguro-123"
```

### 5.3. Testing endpoint público

```bash
# NO requiere auth ni bypass
curl http://localhost:8788/api/public/content | jq .

# Verificar que solo retorna visible=1
curl http://localhost:8788/api/public/content | jq '.beers[] | select(.visible == 0)'
# Debería retornar vacío
```

---

## 6. Upload de imágenes

### 6.1. Upload directo via API

```bash
# 1. Subir archivo a R2
curl -X POST http://localhost:8788/api/r2/upload \
  -H "ADMIN_DEV_BYPASS_SECRET: mi-secret-super-seguro-123" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=beers"

# Response:
{
  "r2Key": "beers/abc123xyz.jpg",
  "filename": "image.jpg",
  "size": 123456,
  "contentType": "image/jpeg",
  "url": "/media/beers/abc123xyz.jpg"
}

# 2. Crear registro en tabla images
curl -X POST http://localhost:8788/api/images \
  -H "Content-Type: application/json" \
  -H "ADMIN_DEV_BYPASS_SECRET: mi-secret-super-seguro-123" \
  -d '{
    "key": "beer.ipa-experimental",
    "section": "beer",
    "r2_key": "beers/abc123xyz.jpg",
    "alt": "IPA Experimental",
    "visible": 1
  }'

# 3. Asociar imagen a cerveza
curl -X PUT http://localhost:8788/api/beers/beer123 \
  -H "Content-Type: application/json" \
  -H "ADMIN_DEV_BYPASS_SECRET: mi-secret-super-seguro-123" \
  -d '{ "image_id": "img456" }'
```

### 6.2. Servir imágenes

```bash
# Proxy R2 (sin validación de visibilidad en MVP)
curl http://localhost:8788/media/beers/abc123xyz.jpg --output test.jpg

# Verificar headers
curl -I http://localhost:8788/media/beers/abc123xyz.jpg
# Cache-Control: public, max-age=31536000, immutable
```

---

## 7. Wrangler dev (desarrollo local)

### 7.1. Instalar dependencias

```bash
npm install
```

### 7.2. Crear recursos D1 y R2 (local)

**Recursos remotos ya provisionados en Cloudflare:**
- ✅ Base de datos D1 `don-franco-content` (id: `81366035-9e8d-4a2c-b0ce-af41d29cd220`) - schema y seed aplicados remotamente
- ✅ Bucket R2 `don-franco-media` creado

```bash
# Crear base de datos D1 (local para dev)
wrangler d1 create don-franco-content-local

# Copiar database_id al wrangler.jsonc

# Aplicar schema
wrangler d1 execute don-franco-content-local --file=ops/d1/schema.sql --local

# Crear bucket R2 (solo una vez, no local)
wrangler r2 bucket create don-franco-media
```

### 7.3. Iniciar dev server

```bash
# Pages dev (incluye Astro + Functions)
npx wrangler pages dev --port 8788 --live-reload -- npm run dev

# O usar Astro dev directamente (Functions disponibles en runtime Pages)
npm run dev
```

### 7.4. Testing con D1 local

```bash
# Consultar D1 local
wrangler d1 execute don-franco-content-local --command "SELECT * FROM beers" --local

# Seed data para testing
wrangler d1 execute don-franco-content-local --file=ops/d1/seed.sql --local
```

---

## 8. Deploy a Cloudflare Pages

### 8.1. Push rama

```bash
git add .
git commit -m "feat: Fase 2 - Admin API con Cloudflare Access"
git push -u origin cursor/feat-admin-phase2-api-d8e0
```

### 8.2. Crear pull request (draft)

Ver instrucciones en sección 10.

### 8.3. Pages auto-deploy

Cloudflare Pages detecta el push y hace deploy automático de la rama. El preview estará en:

```
https://feat-admin-phase2-api-d8e0.don-franco-v2.pages.dev
```

Verificar que bindings D1 y R2 están configurados en **Pages Settings > Functions**.

---

## 9. Validaciones finales

### 9.1. Checklist funcional

- [ ] Endpoint `/api/beers` retorna 401 sin JWT válido
- [ ] Dev bypass funciona con `ADMIN_DEV_BYPASS_SECRET` header
- [ ] Endpoint `/api/public/content` retorna solo `visible=1`
- [ ] Cascada menú: items con `category.visible=0` no aparecen en `/api/public/content`
- [ ] Soft delete: `DELETE /api/beers/:id` → `deleted_at IS NOT NULL`
- [ ] Hard delete: `DELETE /api/beers/:id?hard=true` → fila eliminada de D1
- [ ] Upload R2: `POST /api/r2/upload` → archivo en bucket + retorna `r2_key`
- [ ] Media proxy: `/media/:key` sirve archivo desde R2
- [ ] Publish: `POST /api/publish` → crea entrada en `publish_log` + llama webhook (si configurado)

### 9.2. Testing JWT real (producción)

```bash
# 1. Obtener JWT desde Cloudflare Access
# Abrir https://don-franco-v2.pages.dev/admin en navegador
# Login con email autorizado
# Abrir DevTools > Application > Cookies > buscar "CF_Authorization"
# Copiar valor del cookie (es el JWT)

# 2. Hacer request con JWT
curl -X POST https://don-franco-v2.pages.dev/api/beers \
  -H "Content-Type: application/json" \
  -H "Cf-Access-Jwt-Assertion: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{ "name": "IPA Test", "style": "IPA", "visible": 1 }'
```

---

## 10. Troubleshooting

### 10.1. Error: `Missing Cf-Access-Jwt-Assertion header`

**Causa:** Request sin JWT o con dev bypass desactivado.

**Solución:**
- En local: agregar header `ADMIN_DEV_BYPASS_SECRET` con valor correcto.
- En prod: asegurar que Cloudflare Access está configurado y usuario está autenticado.

### 10.2. Error: `JWT validation failed`

**Causa:** JWT inválido, expirado, o `ACCESS_AUD`/`ACCESS_TEAM_DOMAIN` incorrectos.

**Solución:**
- Verificar que `ACCESS_AUD` y `ACCESS_TEAM_DOMAIN` coinciden con configuración de Access.
- Re-login en Cloudflare Access para obtener JWT fresco.
- Verificar que Access public keys son accesibles: `curl https://your-team.cloudflareaccess.com/cdn-cgi/access/certs`

### 10.3. Error: `Failed to fetch Access certs`

**Causa:** `ACCESS_TEAM_DOMAIN` incorrecto o red bloqueada.

**Solución:**
- Verificar `ACCESS_TEAM_DOMAIN` (debe ser `your-team.cloudflareaccess.com`, NO incluir `https://`).
- Testing: `curl https://your-team.cloudflareaccess.com/cdn-cgi/access/certs` debe retornar JSON con `keys`.

### 10.4. Bindings D1/R2 no disponibles

**Causa:** Wrangler dev no detecta bindings o Pages no tiene configurado.

**Solución local:**
```bash
# Verificar wrangler.jsonc tiene d1_databases y r2_buckets configurados
# Reiniciar wrangler dev
npx wrangler pages dev --port 8788 -- npm run dev
```

**Solución Pages:**
- Dashboard > Pages > don-franco-v2 > Settings > Functions > D1 database bindings
- Agregar binding `DB` → seleccionar database `don-franco-content`
- Agregar binding `R2_BUCKET` → seleccionar bucket `don-franco-media`

### 10.5. Deploy hook no funciona

**Causa:** URL incorrecta o permisos.

**Solución:**
- Verificar `CF_PAGES_DEPLOY_HOOK_URL` es la URL completa copiada de Pages dashboard.
- Testing manual: `curl -X POST $CF_PAGES_DEPLOY_HOOK_URL` debe retornar 200 OK.
- Verificar logs en Pages > Deployments para ver si deploy inició.

---

## 11. Próximos pasos (Fase 3)

- [ ] Admin UI React/Vue en `/admin` (formularios CRUD)
- [ ] Integrar endpoints API con UI
- [ ] Pantalla "Publicar" con log de publicaciones + polling status
- [ ] Testing E2E: crear cerveza en admin → verificar aparece en sitio público tras publish

---

## 12. Recursos

- **Schema D1:** `ops/d1/schema.sql`
- **Endpoints código:** `functions/api/*.ts`
- **Helpers auth:** `functions/_shared/auth.ts`
- **Helpers DB:** `functions/_shared/db-helpers.ts`
- **Plan completo:** `docs/planes/PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md`
- **Cloudflare Access docs:** https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/
- **Pages Functions docs:** https://developers.cloudflare.com/pages/functions/

---

**Fin del runbook Fase 2.**
