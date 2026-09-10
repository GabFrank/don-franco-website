# Auditoría B: Panel Admin Cloudflare — UX producto + integración sitio

**Auditor:** AUDITOR B (product UX + public site integration + migration)  
**Plan fuente:** `docs/planes/PLAN-ADMIN-PANEL-CLOUDFLARE.md` @ `cursor/plan-admin-panel-cloudflare-757c`  
**Rama sitio v2:** `cursor/feat-v2-greenfield-8e75` (PR #1)  
**Fecha:** 2026-09-10  

---

## Veredicto: **PASS-with-fixes**

El plan cumple requisitos core (D1+R2+Access, visible default true, módulos MVP, sin cutover) y la arquitectura es sólida para el contexto. Requiere **correcciones de prioridad P0/P1** antes de implementación, principalmente en granularidad del modelo de contenido y especificación de migración.

---

## P0 — Bloqueantes (deben resolverse antes de implementar)

### P0.1 — Modelo de contenido: especificar granularidad de `visible`

**Problema:** La sección §4 menciona entidades (`settings`, `text_blocks`, `images`, `beers`, `menu_items`, `menu_pages`, `gallery_images`, `review_quotes`, `review_stats`) pero no define **qué nivel de granularidad** tiene el flag `visible` en cada caso.

**Casos ambiguos críticos:**

1. **Hero (`site.json` → `hero`):**
   - ¿El `hero.title` y `hero.description` son UN `text_block` con visible global o DOS bloques independientes?
   - ¿El `hero.ctaText` es editable separado o parte del hero?
   - ¿`hero.backgroundImages[]` tiene visible POR IMAGEN o por conjunto?

2. **Story (`site.json` → `story`):**
   - `story.paragraphs` es array de 4 strings. ¿Cada párrafo es un `text_block` con visible propio o el bloque story es atómico?
   - `story.chips[]` (2018, 2020, Salto del Guairá) — ¿son 3 entidades con visible o parte del story?

3. **Beers (`site.json` → `beers.items[]`):**
   - Plan dice "card completa o solo foto". Esto implica **DOS flags**: ¿`visible` de la entidad beer + `image.visible` de su foto?
   - Necesario aclarar: ¿puede mostrarse una beer SIN foto (placeholder) o `image.visible=false` oculta la card entera?

4. **Menu digital (`menu-digital.json`):**
   - ¿`visible` se aplica a nivel `category` (ocultar "Pizzas" completa)?
   - ¿O a nivel `item` (ocultar "Bacon BBQ" dentro de Hamburguesas)?
   - ¿O ambos niveles (category.visible + item.visible en cascada)?

5. **Menu PNG (`menu-pages.json`):**
   - Tiene 12 páginas. ¿Cada `page` es una entidad con visible propio?
   - ¿Ocultar página 5 significa que el slideshow salta de 4 a 6?

6. **Contact (`site.json` → `contact`):**
   - Plan no menciona módulo Contacto pero sitio v2 tiene `ContactSection` con WhatsApp + dirección + horarios.
   - ¿Estos son editables? ¿Tienen visible independiente?

**Requerido P0:** Documento de **schema detallado** (tabla entidad → campos → tipo + visible scope) antes de fase 1. Sugerencia: agregar apéndice "Schema D1 MVP" con DDL SQL comentado mostrando qué tiene flag visible.

---

### P0.2 — Migración: estrategia Drive→R2 no definida

**Problema:** Plan §8 deja Drive→R2 como "decisión abierta" pero:

- Sitio v2 actual consume **directamente de Drive** (`menu-pages.json` tiene URLs `drive.google.com/file/d/.../view`, galería usa `folderUrl` con API key).
- Admin MVP propuesto usa **R2** para binarios.
- No hay plan de migración explícito: ¿quién sube las 12 páginas PNG + ~50 fotos galería a R2? ¿Cuándo?

**Impacto:**

- Si R2 va en MVP (propuesto), **fase 1 (seed)** necesita script para:
  1. Descargar todos los assets Drive referenciados en `menu-pages.json`, `site.json` (hero backgrounds, gallery fallbacks).
  2. Subirlos a R2 con naming scheme consistente (ej: `menu-pages/page-01.png`, `gallery/img-001.jpg`).
  3. Poblar D1 con nuevas URLs R2 (`https://<account>.r2.dev/<bucket>/...`).

- **Alternativa:** MVP lee Drive tal cual, migración a R2 es post-MVP → pero entonces ¿para qué R2 en arquitectura MVP? Contradicción.

**Requerido P0:** Definir:

1. **¿R2 está en MVP?** Si sí: especificar script de migración Drive→R2 en fase 1 (puede ser manual con Wrangler R2 CLI + CSV de URLs).
2. **¿O MVP lee Drive?** Si sí: actualizar arquitectura (quitar R2 de §3), postponer R2 a fase post-MVP.

**Recomendación auditor:** R2 en MVP **solo si** hay script automatizado de migración. Si no, posponer R2 (usar URLs Drive en D1 por ahora, migrar después). La carga manual de 60+ assets es propensa a error.

---

### P0.3 — "Publicar" en MVP: especificar mecanismo rebuild

**Problema:** Plan §3 dice "Deploy hook → rebuild preview (MVP)" pero no detalla:

- ¿Qué servicio es el hook? (Cloudflare Pages webhook, GitHub Actions dispatch, manual?)
- ¿Rebuild dónde? (Pages production, Pages preview branch, otro?)
- ¿Cómo el sitio Astro lee D1 en build-time? (Pages Functions fetch durante `astro build`, Wrangler binding, API HTTP?)

**Contexto crítico:**

- Sitio v2 actual es **Astro SSG puro** (Static Site Generation) que lee `src/content/*.json` en build.
- Para que "Publicar" funcione, Astro build necesita **obtener datos de D1** en lugar de JSON estáticos.
- Esto requiere:
  1. **Build-time data fetching:** Astro 7 soporta `getStaticPaths()` con `fetch()` a API Pages Functions que lee D1.
  2. **O:** Wrangler binding D1 en entorno de build (requiere `wrangler pages deploy` con bindings).

**Requerido P0:** Especificar en fase 4:

1. Cómo Astro components obtienen data D1 (¿nuevo `/api/content` endpoint en Pages Functions llamado desde `src/pages/index.astro` en build?).
2. Cómo admin UI invoca rebuild (¿webhook Cloudflare Pages? ¿GitHub Actions dispatch con PAT? ¿`wrangler pages deployment create`?).
3. Dónde se publica el rebuild (¿preview URL fijo tipo `admin-preview.pages.dev`? ¿O overwrite production?).

**Riesgo:** Sin esto, fase 4 puede bloquearse en "no sé cómo triggerear rebuild" o "Astro no ve D1".

---

## P1 — Críticos (deben resolverse en implementación temprana)

### P1.1 — UX del visible: cascada y bulk operations

**Observación:** Plan especifica visible default true y comportamiento hide/show correcto, pero no cubre:

1. **Cascada:** Si `category.visible = false`, ¿los items dentro heredan estado o tienen UX independiente?
   - Ejemplo: ocultar categoría "Postres" (2 items). Luego mostrar categoría. ¿Los items reaparecen automáticamente o necesitan toggle manual?

2. **Bulk visibility:** Con 12 páginas de carta PNG, ¿hay "ocultar/mostrar todas" en módulo Menú?
   - Sin esto, cambiar estado de 12 páginas = 12 clicks.

3. **Preview de hidden:** ¿El admin UI muestra ítems con `visible=false` tachados / grises / en sección aparte?
   - Sin indicación visual, editor puede olvidar qué está oculto.

**Requerido P1:** Especificar en fase 3 (Admin UI):

- Cascada de visible: proponer "herencia automática" (ocultar padre oculta hijos en sitio público, pero admin permite toggle individual).
- Bulk actions: checkbox "Mostrar/ocultar todo" en listas largas (menu pages, gallery).
- UI de estado: clases CSS `.item-hidden` (opacity 0.5) + badge "Oculto" en cards admin.

---

### P1.2 — Fit modelo → secciones Astro v2 actuales

**Análisis de cobertura:**

| Sección Astro v2 | Contenido actual (`site.json`) | ¿Cubierto en plan? | Gaps |
|------------------|-------------------------------|-------------------|------|
| `Hero.astro` | `hero{title, tagline, description, ctaText, backgroundImages[]}` | ✅ Parcial (`text_blocks`, `images`) | ⚠️ backgroundImages: ¿es array de `images` con visible c/u? |
| `StorySection.astro` | `story{title, paragraphs[4], chips[3]}` | ✅ Parcial (`text_blocks`) | ⚠️ Chips no mencionados explícitamente |
| `BeerStrip.astro` | `beers{title, items[6]}` cada beer tiene `{name, style, notes, image}` | ✅ (`beers` entity) | ✅ OK si visible aplica a beer completa |
| `MenuSection.astro` | `menu{mode, modes{png, digital}}` | ✅ (`menu_items`, `menu_pages`) | ⚠️ mode switcher: ¿es setting editable en admin? |
| `GallerySection.astro` | `gallery{title, intro, folderUrl, limit, fallbackImages[]}` | ✅ (`gallery_images`) | ⚠️ folderUrl: ¿se mantiene o migra a R2? |
| `ReviewsSection.astro` | `reviews{title, rating, reviewCount, quotes[2]}` | ✅ (`review_quotes`, `review_stats`) | ✅ OK |
| `ContactSection.astro` | `contact{whatsapp, address, hours}` | ❌ **NO mencionado** | ⚠️ P1: agregar módulo Contacto |
| `MapSection.astro` | `map{title, embedUrl}` | ❌ **NO mencionado** | 🟡 Opcional (embedUrl rara vez cambia) |
| `Footer.astro` | `footer{tagline, mapsUrl, social, legalText}` | ❌ **NO mencionado** | 🟡 Opcional (config global rara vez cambia) |

**Requerido P1:**

1. **Contacto:** Agregar a módulos MVP (Textos > Contacto con WhatsApp/dirección/horarios editables, sin visible — son datos core).
2. **Story chips:** Aclarar si chips (2018, 2020, Salto del Guairá) son editables/con visible o hardcoded.
3. **Menu mode switcher:** Decidir si `menu.mode` (png/digital/both) es editable en admin (dropdown "Modo de menú") o requiere cambio manual en D1/settings.

**Riesgo menor:** Sin módulo Contacto, editor necesita tocar D1 directamente para cambiar teléfono/horarios (mal UX).

---

### P1.3 — Seed data: validación contra content actual

**Observación:** Plan §4 dice "migrar desde `site.json`, `menu-digital.json`, beers" pero:

- `menu-digital.json` es **seed data** con 3 burgers, 3 pizzas, 2 cortes, 5 bebidas, 2 postres (total 15 items).
- `menu-pages.json` (PNG actual) tiene **12 páginas** con contenido real en Drive.
- **No están sincronizados:** digital es demo, PNG es producción actual.

**Para seed MVP:**

- ¿Se pobla D1 con digital (15 items demo) o se intenta extraer data real de PNG? (imposible sin OCR).
- ¿Se mantienen ambos modos en MVP? (PNG con 12 real + digital con 15 demo desconectados?)

**Requerido P1:** Aclarar estrategia de seed:

1. **Opción A (recomendada):** Seed con PNG real (12 páginas) en `menu_pages` + digital vacío (o solo 3 featured items extraídos manualmente). Admin permite agregar items digitales después.
2. **Opción B:** Seed con ambos tal cual (PNG 12 real, digital 15 demo), agregar UI para indicar "Menú digital es demo, completar para habilitar modo digital".

**No bloquea desarrollo** pero afecta QA en fase 5 (si seed tiene data incoherente, testing es confuso).

---

## P2 — Mejoras recomendadas (no bloquean MVP)

### P2.1 — Decisiones abiertas: proponer defaults razonables

**Análisis de §8:**

| Decisión | Opciones | Default propuesto plan | Comentario auditor |
|----------|---------|----------------------|-------------------|
| Monorepo vs repo admin | Monorepo / repo separado | Monorepo | ✅ Correcto: reduce complejidad deploy, comparte types D1 |
| `/admin` vs subdominio | `/admin` ruta + Access / `admin.donfrancorestaurante.com` | `/admin` + Access | ✅ Correcto: más simple, Access protege ruta |
| Drive→R2 en MVP | Sí / No | Sí (propuesto) | ⚠️ Ver P0.2: solo si hay script migración |

**Recomendación P2:** Convertir defaults propuestos en **decisiones formales** en versión final del plan (quitar "abierto", agregar justificación breve).

Ejemplo: "**Decisión formal:** Monorepo. Justificación: types compartidos, deploy unificado, equipo pequeño (1-2 devs)."

---

### P2.2 — Publish DX: preview antes de production

**Observación:** Plan §3 menciona "rebuild preview (MVP)" pero no especifica workflow completo:

1. Editor hace cambios en `/admin` → guarda en D1.
2. Click en **"Publicar"** → ¿triggeea rebuild de qué?
   - ¿Preview URL (ej: `preview.donfrancorestaurante.com`) para QA pre-producción?
   - ¿O directamente producción (riesgoso)?

**Best practice:** MVP debe tener **preview separado de producción**:

- "Publicar" → rebuild `preview.pages.dev` (Cloudflare Pages branch preview).
- Editor QA preview URL.
- **Separado:** botón "Publicar a producción" (solo Gabriel) → rebuild producción.

**Recomendación P2:** Agregar en fase 4:

- Preview automático en "Publicar" (Cloudflare Pages preview branch `admin-changes`).
- Botón "Publicar a producción" separado (requiere confirmación + log de quien publicó).

**Beneficio:** Evita errores en producción (ej: publicar con cerveza/imagen rota sin darse cuenta).

---

### P2.3 — Monitoreo de flags visible en producción

**Riesgo:** Con muchos ítems ocultos (`visible=false`), editor puede **olvidar** qué está escondido en producción (ej: promoción temporal de cerveza de verano oculta desde marzo, nunca re-activada).

**Recomendación P2:** Dashboard simple en admin:

- **"Contenido oculto"** (lista global de todos los ítems con `visible=false`):
  - "Cerveza Stout (oculta desde 2026-08-15)"
  - "Párrafo story 3 (oculto desde 2026-09-01)"
- Permite bulk "mostrar" si fue olvido.

**No crítico** (puede agregarse post-MVP) pero mejora UX operativo.

---

### P2.4 — Testing de cascada visible en fase 5 (QA)

**Recomendación:** Checklist QA fase 5 debe incluir:

- ✅ Ocultar cerveza → no aparece en `BeerStrip` público.
- ✅ Ocultar página 5 de carta PNG → slideshow salta 4→6.
- ✅ Ocultar categoría "Postres" → no renderiza en `MenuSection` digital.
- ✅ Ocultar `hero.backgroundImages[0]` → hero usa imagen 2.
- ✅ Mostrar cerveza previamente oculta → reaparece en sitio tras rebuild.
- ✅ Borrado hard de cerveza → desaparece de admin + sitio (irreversible, confirmación funciona).

Sin testing exhaustivo de visible, riesgo de bugs sutiles (ej: item oculto pero su imagen se renderiza igual).

---

## ✅ Fortalezas del plan

### ✅ 1. Arquitectura Cloudflare-native sólida

- **D1 + R2 + Access** es stack correcto para caso de uso (CRUD autenticado + binarios + auth simple).
- **Pages Functions** como API evita necesidad de Workers separado (menos complejidad).
- **Sin backend externo** (no Supabase, no Firebase) reduce vendor lock-in y costo.

### ✅ 2. Requisito `visible` bien diseñado

- **Default true** es correcto (evita publicar contenido accidentalmente oculto).
- Separación hide (reversible) vs delete (confirmación) es UX estándar correcto.
- Aplicable a textos + imágenes cubre 100% de casos de uso.

### ✅ 3. Scope MVP realista

- **6 módulos** (Textos/Menú/Cervezas/Galería/Reseñas/Publicar) cubren 90% del contenido dinámico actual.
- **Fuera de MVP** bien definido (checkout, multi-local, i18n, roles) — evita scope creep.
- **Sin cutover** hasta aprobación protege producción legacy.

### ✅ 4. Fases lógicas

- Fase 0 (decisiones) → 1 (schema) → 2 (API) → 3 (UI) → 4 (integración) → 5 (QA) es orden correcto.
- Dependencias claras (no puede hacer UI sin API, no puede QA sin integración).

### ✅ 5. Riesgos identificados

- §9 menciona auth leakage, unpublish accidental, rebuild lag, cream token gotcha.
- Muestra conciencia de problemas potenciales (mejor que plan sin sección de riesgos).

---

## Decisiones abiertas restantes (post-corrección P0)

Después de resolver P0.1–P0.3, quedan estas decisiones menores:

1. **Naming scheme R2:** ¿carpetas `menu-pages/`, `gallery/`, `beers/` o flat con prefijos `menu-page-01.png`?
2. **Soft delete:** ¿Necesario en MVP o hard delete es suficiente? (Soft delete = flag `deleted_at`, permite restaurar).
3. **Logs de publicación:** ¿Tabla `publish_log` con timestamp + usuario + commit/build ID?
4. **Orden de items:** ¿Drag-and-drop en admin para reordenar menú/galería o solo orden alfabético/ID?

**Recomendación:** Resolver en fase 1–2 (no bloquean planificación pero afectan schema).

---

## Correcciones requeridas antes de implementación

### Antes de fase 0 (decisiones):

- [ ] **P0.1:** Agregar apéndice "Schema D1 detallado" con tabla entidades → campos → visible scope.
- [ ] **P0.2:** Definir estrategia Drive→R2: ¿MVP incluye migración automatizada o se postpone R2?
- [ ] **P0.3:** Especificar mecanismo "Publicar": hook tipo, rebuild target, data fetching Astro.

### Antes de fase 1 (seed):

- [ ] **P1.1:** Especificar UX visible: cascada, bulk ops, preview de hidden.
- [ ] **P1.2:** Agregar módulo Contacto; aclarar chips story, menu mode switcher.
- [ ] **P1.3:** Definir seed strategy: PNG real + digital vacío vs ambos con disclaimer.

### Post-MVP (P2, no bloquean):

- [ ] P2.1: Convertir defaults propuestos en decisiones formales.
- [ ] P2.2: Agregar preview separado de producción en workflow publicar.
- [ ] P2.3: Dashboard "contenido oculto" global.
- [ ] P2.4: Extender checklist QA fase 5 con casos visible.

---

## Conclusión

El plan es **viable y bien estructurado**, cumple requisitos (D1/R2/Access, visible default true, módulos, sin cutover) y la arquitectura es apropiada para el contexto (Cloudflare Pages + Astro SSG).

**Bloqueos P0** son principalmente **falta de especificidad** en áreas críticas (granularidad schema, migración assets, mecanismo rebuild) que causarían confusión o bloqueos en implementación si no se resuelven primero.

**Recomendación:** Resolver P0.1–P0.3 (agregar apéndices schema + migración + publish al plan), luego proceder a implementación fase 1. P1 puede resolverse en paralelo durante fases tempranas. P2 puede posponerse a post-MVP.

**Aprobación condicional:** PASS-with-fixes — implementar tras correcciones P0.

---

**Auditor B:** ✅ Revisión completa  
**Próximo paso:** Auditor A (arquitectura + infraestructura + seguridad) + aprobación Gabriel
