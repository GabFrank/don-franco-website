# Auditoría A: Panel Admin Don Franco (Seguridad + Modelo de Datos + Ops)

**Auditor:** AUDITOR A  
**Fecha:** 2026-09-10  
**Plan auditado:** `PLAN-ADMIN-PANEL-CLOUDFLARE.md` (branch `cursor/plan-admin-panel-cloudflare-757c`)  
**Contenido analizado:** `src/content/site.json`, `menu-digital.json`  

---

## VEREDICTO: **PASS-with-fixes**

El plan es sólido en dirección arquitectónica y cumple con el requisito crítico del flag `visible`. Sin embargo, requiere **correcciones obligatorias** en especificación de schema D1, seguridad de R2 y estrategia de migración antes de implementación.

---

## HALLAZGOS PRIORITARIOS

### P0 (BLOQUEANTE — resolver antes de implementar)

#### P0-1: Schema D1 no especificado — flag `visible` sin detalle de implementación

**Problema:**  
El plan menciona que "todas con `visible` default true donde aplique texto/imagen" pero NO define:
- Estructura de tablas D1 exacta con columnas `visible`
- Qué entidades tienen el flag a nivel de fila vs columna específica
- Granularidad: ¿`hero.backgroundImages[2]` tiene `visible` individual o es `hero.visible` global?

**Riesgo:**  
Implementación inconsistente → algunos textos/imágenes sin control de visibilidad → incumple requisito transversal crítico.

**Ejemplo concreto del problema:**

```json
// site.json actual
"story": {
  "paragraphs": [
    "Don Franco nace de nuestra pasión por lo artesanal.",
    "Todo comenzó en 2018...",
    "En ese camino descubrimos...",
    "Hoy combinamos..."
  ]
}
```

¿Cada párrafo es una fila con `visible`? ¿O `story` tiene `visible` global? El plan no lo especifica.

**Enmienda requerida:**  
Agregar **Apéndice A: Schema D1 completo** con:

```sql
-- EJEMPLO de lo que debe incluirse:

CREATE TABLE text_blocks (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL, -- 'hero_title', 'hero_tagline', 'story_paragraph', etc.
  content TEXT NOT NULL,
  visible INTEGER DEFAULT 1, -- boolean: 1 = mostrar, 0 = ocultar
  sort_order INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE images (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL, -- 'hero_bg', 'gallery', 'beer', 'menu_item', etc.
  r2_key TEXT NOT NULL, -- path en bucket R2
  public_url TEXT,
  alt_text TEXT,
  visible INTEGER DEFAULT 1,
  sort_order INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE beers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT,
  notes TEXT,
  image_id TEXT, -- FK a images
  visible INTEGER DEFAULT 1, -- oculta card completa
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (image_id) REFERENCES images(id)
);

-- Y así para: menu_items, menu_categories, menu_pages, gallery_images, 
-- review_quotes, settings (hero title/tagline como filas), etc.
```

**Decisión pendiente del plan:**  
¿Chips de historia ("2018", "2020", "Salto del Guairá") son `text_blocks` separados con `visible` individual o parte del párrafo? **Debe resolverse en schema.**

---

#### P0-2: R2 bucket público sin estrategia de URL firmadas

**Problema:**  
Plan menciona "R2 binarios" pero no especifica:
- ¿Bucket público o privado?
- Si público: cualquiera con URL puede acceder aunque `visible=false` en D1
- Si privado: ¿presigned URLs? ¿TTL? ¿regeneración en rebuild?

**Riesgo de seguridad:**  
Imagen con `visible=false` sigue accesible vía URL directa si alguien guardó el link → **filtrado no efectivo**.

**Escenario de ataque:**
1. Gabriel sube foto de cerveza nueva (visible=true)
2. Usuario malintencionado ve `https://r2.donfranco.com/beers/nueva-cerveza.jpg`
3. Gabriel pone `visible=false` antes de lanzamiento oficial
4. Foto sigue accesible vía URL directa → leak de producto no anunciado

**Enmienda requerida:**  
Plan debe especificar:
- **MVP:** Bucket R2 público + URLs públicas estáticas (acepta riesgo de leak, documentar limitación)
- **Post-MVP recomendado:** Presigned URLs con TTL 1-24h, regeneradas en cada rebuild
- **Alternativa segura:** Cloudflare Images (costos) o servir imágenes vía Pages Function que valida `visible` antes de devolver blob

**Mitigación inmediata MVP:**  
Usar nombres de archivo no predecibles (`uuid.jpg` en vez de `cerveza-ipa.jpg`) + documentar que `visible=false` no oculta archivos ya descubiertos.

---

#### P0-3: Estrategia de migración JSON → D1 ausente

**Problema:**  
Plan dice "migrar desde site.json" pero no define:
- ¿Script de migración SQL/TypeScript?
- ¿Cómo se mapean arrays anidados a tablas relacionales?
- ¿Orden de ejecución (schema → seed → validación)?
- ¿Qué hacer con Drive URLs existentes en `backgroundImages`, `folderUrl`?

**Ejemplo complejo:**

```json
// menu-digital.json actual
"categories": [
  {
    "id": "hamburguesas",
    "items": [
      { "id": "classic", "name": "Don Franco Classic", "price": 45000 },
      { "id": "bacon-bbq", "badge": "Premium" }
    ]
  }
]
```

¿Qué tablas? ¿`menu_categories` + `menu_items`? ¿FK constraints? ¿`visible` en categoría oculta todos los items?

**Riesgo:**  
Migración manual propensa a errores → datos incompletos → sitio público roto al publicar.

**Enmienda requerida:**  
Agregar **Fase 1.5: Script de migración** con:
- Script TypeScript que lee JSON → genera INSERTs con `visible=1`
- Validación post-migración (row counts, foreign keys, todos los textos/imágenes tienen `visible`)
- Plan de rollback si migración falla
- Documentar mapeo JSON → tablas D1 línea por línea

---

#### P0-4: Cloudflare Access bypass potencial — autenticación en API no especificada

**Problema:**  
Plan menciona "Cloudflare Access (Gabriel + invitados)" para admin UI pero:
- ¿Las Pages Functions del API validan Access JWT?
- ¿O confían en que Access bloquea requests no autenticados?
- ¿Qué pasa si alguien llama API directamente sin pasar por UI?

**Riesgo de seguridad:**  
Si Pages Functions no validan JWT de Access:
- Attacker puede hacer `curl` directo a `/api/beers` y modificar contenido
- Access solo protege HTML, no endpoints API

**Prueba de concepto:**
```bash
# Si API no valida Access:
curl -X POST https://donfranco.com/api/menu-items \
  -H "Content-Type: application/json" \
  -d '{"name":"Spam Burger","price":1,"visible":true}'
# ¿Esto funciona sin autenticación? Debe fallar con 401.
```

**Enmienda requerida:**  
Plan debe especificar:
- Toda Pages Function de admin valida header `Cf-Access-Jwt-Assertion`
- Validar firma JWT con Access public key (Cloudflare SDK)
- Rate limiting en API (10 req/min por IP) para mitigar brute force
- Ejemplo de código:

```typescript
// Debe incluirse en plan
export async function onRequestPost(context) {
  const jwt = context.request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt || !await validateAccessJWT(jwt, context.env)) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... lógica CRUD D1
}
```

---

#### P0-5: Soft-delete vs hard-delete sin implementación clara

**Problema:**  
Plan dice "Borrado duro es acción aparte (confirmación / peligro)" pero no define:
- ¿D1 tiene columna `deleted_at` para soft-delete?
- ¿O se usa `visible=false` como soft-delete?
- ¿Hard-delete es `DELETE FROM` SQL o marca `deleted_at` permanente?
- ¿Imágenes en R2 se borran físicamente o quedan huérfanas?

**Confusión actual:**  
Si `visible=false` es "ocultar", ¿cómo se diferencia de "borrar suave"? ¿O son lo mismo?

**Caso de uso:**  
Gabriel quiere eliminar cerveza discontinuada para siempre (no solo ocultarla). ¿Cómo?

**Enmienda requerida:**  
Plan debe clarificar:

**Opción A (recomendada):**
- `visible=false` → ocultar temporalmente (reversible en UI)
- `deleted_at` → soft-delete (va a papelera, recuperable 30 días)
- Hard-delete → `DELETE FROM` + borrado físico R2 (requiere confirmación doble)

**Opción B (más simple):**
- `visible=false` → única forma de "borrado" (nunca se borra físicamente)
- Hard-delete no existe en MVP
- Documentar que D1 crecerá con filas ocultas acumuladas

**Schema debe reflejar decisión:**
```sql
CREATE TABLE beers (
  id TEXT PRIMARY KEY,
  visible INTEGER DEFAULT 1,  -- 0 = ocultar
  deleted_at INTEGER,          -- timestamp si soft-delete (NULL = activo)
  -- ...
);
```

---

### P1 (IMPORTANTE — debe resolverse antes de producción)

#### P1-1: Publish race condition — múltiples admins editando simultáneamente

**Problema:**  
Si Gabriel y empleado editan al mismo tiempo:
1. Gabriel pone cerveza IPA `visible=false` → clica "Publicar"
2. Empleado edita precio hamburguesa → clica "Publicar" (30 seg después)
3. ¿Segundo rebuild sobreescribe cambio de Gabriel?

**Riesgo:**  
Cambios perdidos, confusión sobre qué está publicado realmente.

**Mitigación requerida (plan debe incluir):**
- **MVP:** Solo un admin puede publicar (lock pesimista o UI desactiva botón durante rebuild)
- **MVP+:** Deploy queue (encolar cambios, rebuild al finalizar anterior)
- **Post-MVP:** Timestamp `last_published_at` en UI + warning "Cambios pendientes desde [hora]"

---

#### P1-2: Rebuild lag — expectativas de usuario vs realidad

**Problema:**  
Plan dice "rebuild al publicar" pero no especifica:
- ¿Cuánto tarda? (Pages build típico: 30s-2min)
- ¿UI muestra progreso o solo "Publicado" instant feedback falso?
- ¿Qué ve el usuario durante rebuild? (sitio viejo)

**Riesgo UX:**  
Gabriel cambia precio, clica "Publicar", refresca sitio → precio viejo sigue ahí → piensa que falló.

**Mitigación requerida:**
- UI debe mostrar: "Publicando... (puede tardar 1-2 min)" con spinner
- Webhook de Pages debe actualizar estado en D1: `publish_status` table
- Polling desde admin UI para mostrar "Listo ✓" cuando deploy completa
- Documentar en docs de usuario que cambios no son instantáneos

---

#### P1-3: Schema gap — `menu.mode` y `menu.modes.*.enabled` no tienen `visible`

**Problema:**  
`site.json` actual tiene:
```json
"menu": {
  "mode": "png",
  "modes": {
    "png": { "enabled": true },
    "digital": { "enabled": false }
  }
}
```

Estos son **configuraciones globales**, no contenido visible/oculto. Pero el plan dice "todo texto/imagen tiene visible".

**Decisión pendiente:**  
¿`mode` y `enabled` van a tabla `settings` sin `visible`? ¿O modo PNG también puede ocultarse (solo digital disponible)?

**Enmienda requerida:**  
Separar en schema:
- `settings` table → configuraciones sin `visible` (modo menú, WhatsApp number, horarios)
- `text_blocks` / `images` → contenido con `visible`

Documentar qué va a cada tabla en el mapeo JSON→D1.

---

#### P1-4: Granularidad de `visible` en cervezas ambigua

**Problema:**  
Plan dice: "cervezas (card completa o solo foto)".

Esto implica **dos opciones**:
- `beers.visible=false` oculta card completa (nombre+estilo+notas+foto)
- `images.visible=false` solo oculta foto (card muestra texto + placeholder)

**Pregunta sin responder:**  
¿Admin UI tiene **DOS** checkboxes Mostrar (uno en cerveza, otro en imagen)? ¿O solo uno?

**Recomendación:**  
MVP debe decidir:
- **Opción simple:** Un solo `beers.visible` que oculta card completa (imagen included)
- **Opción granular:** Dos flags independientes (más complejo pero más flexible)

Plan debe documentar decisión explícitamente para guiar implementación UI.

---

#### P1-5: Validación de integridad — campos requeridos sin `visible=false`

**Problema:**  
Si Gabriel pone hero title `visible=false`, sitio público renderiza:
```html
<h1></h1> <!-- vacío, malo para SEO y UX -->
```

**Regla de negocio faltante:**  
¿Algunos campos son **obligatorios** (siempre al menos uno visible)?

**Ejemplos:**
- Hero title: al menos una línea visible
- Story: al menos un párrafo visible
- Menú: al menos una categoría visible
- Contact: WhatsApp siempre visible (no tiene sentido ocultarlo)

**Enmienda requerida:**  
Plan debe definir **validation rules**:
- Admin API rechaza publish si campos críticos todos `visible=false`
- UI marca campos requeridos con asterisco
- Documentar lista de "al menos uno visible" por sección

---

### P2 (DESEABLE — mejora post-MVP)

#### P2-1: Rollback de publicación ausente

**Situación:**  
Gabriel publica cambios, sitio se ve mal, quiere volver a versión anterior **ya**.

**Limitación MVP:**  
Debe editar manualmente en admin + republicar (lento, error-prone).

**Sugerencia post-MVP:**  
- D1 guarda snapshot de contenido en cada publish (`publish_history` table)
- Admin UI tiene botón "Restaurar versión anterior"
- Un click hace rollback + rebuild automático

No bloqueante para MVP pero documentar limitación.

---

#### P2-2: Preview antes de publicar

**UX deseada:**  
Gabriel cambia 10 cosas → ve preview con cambios → si OK, publica.

**MVP actual:**  
Solo ve admin UI, no sitio renderizado.

**Sugerencia post-MVP:**  
- Preview URL temporal (Pages Preview con D1 "draft" data)
- Botón "Ver preview" en admin UI

No crítico pero muy útil.

---

#### P2-3: Audit log de cambios de visibilidad

**Caso de uso:**  
"¿Quién ocultó la cerveza Stout la semana pasada?"

**MVP:**  
No hay log, información perdida.

**Sugerencia post-MVP:**  
- Tabla `audit_log` con user, action, entity, timestamp
- Útil para debugging y compliance

---

## LO QUE ESTÁ SÓLIDO ✅

### Arquitectura general impecable
- **Cloudflare Pages + D1 + R2 + Access** es stack correcto para caso de uso
- Separación admin UI / sitio público es limpia
- Rebuild approach (vs lectura live D1) es pragmático para MVP

### Requisito `visible` bien identificado
- Regla transversal crítica está en radar desde el inicio
- "Hide ≠ delete" es decisión correcta
- Default `true` previene contenido oculto accidentalmente

### Fases lógicas
- Progresión Schema → API → UI → Publicar es correcta
- Dejar Drive→R2 como decisión abierta es prudente
- "Fuera de MVP" realista (multi-local, i18n, roles)

### Decisiones propuestas sensatas
- Monorepo es mejor que repo separado (menos overhead)
- `/admin` + Access es más simple que subdominio en MVP
- R2 en MVP es buena idea (evita dos migraciones)

---

## ENMIENDAS REQUERIDAS AL PLAN (resumen)

Antes de implementar, plan debe incluir:

1. **Apéndice A: Schema D1 completo** con todas las tablas, columnas `visible`, FKs, índices
2. **Apéndice B: Script de migración JSON→D1** con validación y rollback
3. **Sección 8.4: Decisión sobre R2 buckets públicos** (público+disclaimer o presigned URLs)
4. **Sección 2.1: Granularidad de `visible`** (qué tiene flag a nivel fila vs columna)
5. **Sección 6: Fase 2.5 — API authentication** con validación de Access JWT en todas las Functions
6. **Sección 9.1: Mitigación race conditions** en publicación simultánea
7. **Sección 5.1: Validation rules** para campos requeridos que no pueden estar todos ocultos
8. **Sección 10: User expectations** sobre rebuild lag (1-2min, no instantáneo)

---

## BLOQUEANTES PARA AUDITOR B

Los siguientes hallazgos **requieren decisión de arquitectura** antes de que Auditor B (UX/completitud) pueda auditar:

- **P0-1 (schema):** UX depende de granularidad `visible` (¿un checkbox o dos por cerveza?)
- **P0-5 (soft-delete):** UI de borrado depende de si hay papelera o solo ocultar
- **P1-3 (settings vs content):** Qué configuraciones son editables vs hardcoded afecta módulos admin

---

## SIGUIENTE PASO RECOMENDADO

**Gabriel / autor del plan:**  
Revisar hallazgos P0, tomar decisiones sobre schema/seguridad, actualizar plan con apéndices requeridos.

**Auditor B:**  
Esperar plan v2 con P0 resueltos, luego auditar UX admin + completitud funcional.

**Implementación:**  
NO comenzar hasta que ambas auditorías estén **PASS** o **PASS-with-fixes resueltos**.

---

**Firma auditora:**  
AUDITOR A — Security + Data Model + Ops  
2026-09-10  
Status: **PASS-with-fixes** (P0 must be resolved before implementation)
