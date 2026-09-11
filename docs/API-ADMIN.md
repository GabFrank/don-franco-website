# Don Franco Admin API Documentation

API REST para gestionar el contenido del sitio web Don Franco. Requiere autenticación mediante token API o Cloudflare Access JWT.

## Base URLs

- **Preview**: `https://[preview-branch].don-franco-website.pages.dev/api`
- **Production**: `https://don-franco.com/api` (o el dominio configurado)

## Autenticación

La API soporta tres métodos de autenticación (en orden de prioridad):

### 1. API Token (Recomendado para bots/scripts)

```bash
# Header X-Admin-Api-Token
curl -H "X-Admin-Api-Token: YOUR_TOKEN_HERE" https://...

# O Authorization Bearer
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" https://...
```

### 2. Cloudflare Access JWT

Automático cuando accedes desde el navegador protegido por Cloudflare Access.

### 3. Dev Bypass (Solo ENVIRONMENT=development)

```bash
curl -H "ADMIN_DEV_BYPASS_SECRET: your-dev-secret" https://...
```

## Variables de Entorno Requeridas (Cloudflare Pages)

Configure estas variables en el dashboard de Cloudflare Pages:

- `ADMIN_API_TOKEN` - Token secreto para autenticación de bots (ej: `my-secure-token-123`)
- `ACCESS_AUD` - Audience ID de Cloudflare Access
- `ACCESS_TEAM_DOMAIN` - Dominio del team de Cloudflare Access (ej: `myteam.cloudflareaccess.com`)
- `ENVIRONMENT` - `development` o `production`
- `ADMIN_DEV_BYPASS_SECRET` - (Opcional) Secret para bypass en desarrollo local
- `DB` - D1 Database binding (configurado automáticamente)
- `R2_BUCKET` - R2 Bucket binding (configurado automáticamente)

## Recursos y Endpoints

### Text Blocks

Bloques de texto organizados por secciones (hero, about, contact, etc.).

#### GET /api/text-blocks
Lista todos los text blocks con filtros opcionales.

**Query Parameters:**
- `section` (opcional): Filtrar por sección (ej: `hero`, `about`)
- `includeHidden` (opcional): `true` para incluir elementos ocultos (default: `false`)
- `includeDeleted` (opcional): `true` para incluir elementos eliminados (default: `false`)

**Respuesta:**
```json
{
  "items": [
    {
      "id": "abc123",
      "key": "hero_title",
      "section": "hero",
      "body": "Bienvenidos a Don Franco",
      "visible": 1,
      "sort_order": 0,
      "created_at": 1234567890,
      "updated_at": 1234567890,
      "deleted_at": null
    }
  ],
  "count": 1
}
```

#### POST /api/text-blocks
Crea un nuevo text block. **Requiere autenticación.**

**Body:**
```json
{
  "key": "hero_subtitle",
  "section": "hero",
  "body": "Cervecería artesanal",
  "visible": 1,
  "sort_order": 1
}
```

#### GET /api/text-blocks/:id
Obtiene un text block por ID.

#### PUT /api/text-blocks/:id
Actualiza un text block. **Requiere autenticación.**

**Body:**
```json
{
  "body": "Nuevo texto actualizado",
  "visible": 0
}
```

#### DELETE /api/text-blocks/:id
Elimina (soft delete) un text block. **Requiere autenticación.**

**Query Parameters:**
- `hard` (opcional): `true` para eliminación permanente

---

### Images

Metadatos de imágenes almacenadas en R2.

#### GET /api/images
Lista todas las imágenes.

**Query Parameters:**
- `section` (opcional): Filtrar por sección
- `includeHidden`, `includeDeleted`: igual que text-blocks

#### POST /api/images
Crea metadata de imagen. **Requiere autenticación.**

**Body:**
```json
{
  "key": "hero_bg",
  "section": "hero",
  "r2_key": "images/hero-background.jpg",
  "alt": "Cervecería artesanal",
  "visible": 1
}
```

#### GET /api/images/:id
Obtiene una imagen por ID.

#### PUT /api/images/:id
Actualiza metadata de imagen. **Requiere autenticación.**

#### DELETE /api/images/:id
Elimina imagen. **Requiere autenticación.**

---

### Beers

Catálogo de cervezas.

#### GET /api/beers
Lista todas las cervezas (incluye datos de imagen relacionada).

#### POST /api/beers
Crea una cerveza. **Requiere autenticación.**

**Body:**
```json
{
  "name": "IPA Tropical",
  "style": "India Pale Ale",
  "notes": "Notas cítricas y tropicales",
  "image_id": "img_123",
  "visible": 1,
  "sort_order": 0
}
```

#### GET /api/beers/:id
Obtiene una cerveza por ID (con datos de imagen).

#### PUT /api/beers/:id
Actualiza una cerveza. **Requiere autenticación.**

#### DELETE /api/beers/:id
Elimina una cerveza. **Requiere autenticación.**

---

### Menu Categories

Categorías del menú.

**Endpoints:** `GET /api/menu-categories`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`

**Estructura:**
```json
{
  "id": "cat_123",
  "title": "Entradas",
  "visible": 1,
  "sort_order": 0
}
```

---

### Menu Items

Items del menú (pertenecen a una categoría).

**Endpoints:** `GET /api/menu-items`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`

**Query Parameters adicionales en GET:**
- `category_id` (opcional): Filtrar por categoría

**Estructura:**
```json
{
  "id": "item_123",
  "category_id": "cat_123",
  "name": "Papas bravas",
  "description": "Con salsa picante",
  "price": 8.50,
  "badge": "Popular",
  "image_id": "img_456",
  "visible": 1,
  "sort_order": 0
}
```

---

### Menu Pages

Páginas de menú físico (imágenes PNG de la carta).

**Endpoints:** `GET /api/menu-pages`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`

**Estructura:**
```json
{
  "id": "page_123",
  "title": "Menú Principal",
  "r2_key": "menus/menu-principal.png",
  "visible": 1,
  "sort_order": 0
}
```

---

### Gallery Images

Imágenes de la galería.

**Endpoints:** `GET /api/gallery-images`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`

**Estructura:**
```json
{
  "id": "gal_123",
  "image_id": "img_789",
  "caption": "Interior del local",
  "visible": 1,
  "sort_order": 0
}
```

---

### Review Quotes

Citas de reseñas de clientes.

**Endpoints:** `GET /api/review-quotes`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`

**Estructura:**
```json
{
  "id": "quote_123",
  "author": "María González",
  "text": "¡Excelente cerveza artesanal!",
  "rating": 5,
  "source": "Google Reviews",
  "source_url": "https://g.co/review/...",
  "visible": 1,
  "sort_order": 0
}
```

---

### Review Stats

Estadísticas globales de reseñas (recurso único, no es colección).

#### GET /api/review-stats
Obtiene las estadísticas.

**Respuesta:**
```json
{
  "average_rating": 4.8,
  "total_reviews": 156,
  "google_rating": 4.9,
  "tripadvisor_rating": 4.7,
  "updated_at": 1234567890
}
```

#### PUT /api/review-stats
Actualiza estadísticas. **Requiere autenticación.**

**Body:**
```json
{
  "average_rating": 4.9,
  "total_reviews": 160
}
```

---

### Contact Info

Información de contacto (recurso único).

#### GET /api/contact-info
Obtiene la información de contacto.

**Respuesta:**
```json
{
  "phone": "+34 123 456 789",
  "email": "info@donfranco.com",
  "address": "Calle Principal 123, Madrid",
  "hours": "Lun-Vie 12:00-00:00",
  "instagram": "@donfranco",
  "facebook": "donfranco",
  "updated_at": 1234567890
}
```

#### PUT /api/contact-info
Actualiza información de contacto. **Requiere autenticación.**

---

### Settings

Configuraciones globales clave-valor.

#### GET /api/settings
Lista todas las configuraciones.

**Respuesta:**
```json
{
  "items": [
    {
      "key": "site_title",
      "value": "Don Franco Cervecería",
      "description": "Título del sitio",
      "updated_at": 1234567890
    }
  ],
  "count": 1
}
```

#### GET /api/settings/:key
Obtiene una configuración por clave.

#### PUT /api/settings/:key
Crea o actualiza una configuración (upsert). **Requiere autenticación.**

**Body:**
```json
{
  "value": "Don Franco - Cerveza Artesanal",
  "description": "Título mostrado en navegador"
}
```

#### DELETE /api/settings/:key
Elimina una configuración. **Requiere autenticación.**

---

### Publish

Trigger para reconstruir el sitio SSG después de cambios de contenido.

#### POST /api/publish
Inicia un rebuild del sitio. **Requiere autenticación.**

**Respuesta:**
```json
{
  "id": "pub_123",
  "status": "triggered",
  "triggered_at": 1234567890
}
```

**Nota importante:** Después de modificar contenido mediante la API, **debes llamar a POST /api/publish** para que Astro regenere las páginas estáticas con los nuevos datos.

#### GET /api/publish
Lista el log de publicaciones.

#### GET /api/publish/:id
Obtiene el estado de una publicación.

---

### R2 Upload

Subida de archivos a R2 (imágenes, PDFs, etc.).

#### POST /api/r2/upload
Sube un archivo a R2. **Requiere autenticación.**

**Body:** `multipart/form-data`
- `file`: El archivo a subir
- `folder` (opcional): Carpeta de destino en R2 (ej: `images`, `menus`)

**Respuesta:**
```json
{
  "success": true,
  "r2_key": "images/foto-123.jpg",
  "url": "https://pub-abc.r2.dev/images/foto-123.jpg"
}
```

---

## Códigos de Estado HTTP

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado exitosamente
- `204 No Content` - Respuesta vacía exitosa (OPTIONS)
- `400 Bad Request` - Datos inválidos o campos requeridos faltantes
- `401 Unauthorized` - Autenticación requerida o token inválido
- `404 Not Found` - Recurso no encontrado
- `405 Method Not Allowed` - Método HTTP no soportado en esta ruta
- `409 Conflict` - Conflicto (ej: clave duplicada)
- `500 Internal Server Error` - Error del servidor

---

## Ejemplos de Uso

### Ejemplo 1: Listar cervezas visibles

```bash
curl https://don-franco.com/api/beers
```

### Ejemplo 2: Crear nueva cerveza (con token)

```bash
curl -X POST https://don-franco.com/api/beers \
  -H "Content-Type: application/json" \
  -H "X-Admin-Api-Token: your-secret-token" \
  -d '{
    "name": "Stout Imperial",
    "style": "Imperial Stout",
    "notes": "Oscura y cremosa",
    "visible": 1
  }'
```

### Ejemplo 3: Actualizar text block

```bash
curl -X PUT https://don-franco.com/api/text-blocks/abc123 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Api-Token: your-secret-token" \
  -d '{
    "body": "Texto actualizado",
    "visible": 1
  }'
```

### Ejemplo 4: Eliminar item del menú

```bash
curl -X DELETE "https://don-franco.com/api/menu-items/item_123" \
  -H "X-Admin-Api-Token: your-secret-token"
```

### Ejemplo 5: Publicar cambios

```bash
curl -X POST https://don-franco.com/api/publish \
  -H "X-Admin-Api-Token: your-secret-token"
```

### Ejemplo 6: Subir imagen

```bash
curl -X POST https://don-franco.com/api/r2/upload \
  -H "X-Admin-Api-Token: your-secret-token" \
  -F "file=@/path/to/imagen.jpg" \
  -F "folder=beers"
```

---

## Workflow Típico para Bots/Grok

1. **Autenticarse** con token en header `X-Admin-Api-Token`
2. **Modificar contenido** usando POST/PUT/DELETE según necesites
3. **Publicar cambios** con `POST /api/publish` para regenerar SSG
4. **Verificar** esperando unos segundos y revisando el sitio público

---

## Notas Técnicas

- **Soft Delete**: Por defecto DELETE hace soft delete (`deleted_at` se actualiza). Usa `?hard=true` para eliminación permanente.
- **CORS**: Habilitado con `Access-Control-Allow-Origin: *`
- **Timestamps**: Unix timestamps (segundos desde epoch)
- **IDs**: Generados con nanoid (alfanuméricos cortos)
- **Transacciones**: D1 no soporta transacciones multi-statement en la API actual
- **Rate Limiting**: No implementado actualmente, considera agregarlo en producción
- **SSG Rebuild**: El sitio usa Astro SSG, por lo que los cambios en la API **no son visibles inmediatamente** en el sitio público hasta llamar a `/api/publish`

---

## Seguridad

- ✅ Autenticación obligatoria para POST/PUT/DELETE
- ✅ GET público para contenido no sensible
- ✅ Token API almacenado en variables de entorno (nunca en código)
- ⚠️ Considera implementar rate limiting en producción
- ⚠️ Valida tamaños de archivo en uploads R2
- ⚠️ Sanitiza inputs para prevenir injection attacks

---

## Ver También

- [Runbook PHASE4](../admin/runbooks/PHASE4-admin-spa.md)
- [Runbook PHASE2](../admin/runbooks/PHASE2-api-routes.md)
- Repositorio: [GabFrank/don-franco-website](https://github.com/GabFrank/don-franco-website)
