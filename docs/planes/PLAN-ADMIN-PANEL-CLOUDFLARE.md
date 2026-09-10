# Plan: Panel de administración Don Franco (Cloudflare)

> **⚠️ ESTE DOCUMENTO ES LA VERSIÓN ORIGINAL**  
> **📄 Ver versión enmendada:** [`PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md`](./PLAN-ADMIN-PANEL-CLOUDFLARE-v2.md)  
> **Estado actual:** v2 incorpora TODAS las correcciones P0 de auditorías A/B — **usar v2 para implementación**

---

**Estado:** borrador formal — pendiente 2 auditorías + aprobación Gabriel  
**Fecha:** 2026-09-10  
**Repo:** `GabFrank/don-franco-website`  
**Branch trabajo sitio:** `cursor/feat-v2-greenfield-8e75` (PR #1 draft)  
**Sitio prod actual:** `donfrancorestaurante.com` (legacy) — **sin cutover** hasta OK explícito  

## 1. Objetivo

Panel propio para editar textos, imágenes, menú/cervezas y reseñas **sin tocar código**, con control fino de qué se muestra públicamente.

## 2. Requisito transversal: "Mostrar"

- **Cada texto** (bloque o campo renderizable) y **cada imagen** tiene un booleano `visible` (UI: checkbox **Mostrar**).
- **Default: `true`.**
- `visible: false` → el sitio público **no renderiza** ese ítem (no borrar datos).
- Borrado duro es acción aparte (confirmación / peligro).
- Aplica a: líneas de hero, párrafos story, chips, ítems de menú, cervezas (card completa o solo foto), slides de carta PNG, fotos de galería, citas de reseñas, etc.

## 3. Arquitectura (dirección)

| Pieza | Rol |
|--------|-----|
| Astro SSG en Cloudflare Pages | Sitio público v2 |
| Admin UI (`/admin` o `admin.*`) | CRUD + uploads + Mostrar |
| Pages Functions / Workers | API autenticada |
| D1 | Contenido estructurado + flags `visible` |
| R2 | Binarios (galería, cervezas, carta) |
| Cloudflare Access | Auth (Gabriel + invitados) |
| Deploy hook | "Publicar" → rebuild preview (MVP) |

**Lectura pública (MVP):** rebuild al publicar (export o build que lee D1). **Post-MVP opcional:** lectura live desde D1/R2.

## 4. Modelo de contenido (seed)

Migrar desde `src/content/site.json`, `menu-digital.json`, beers.

Entidades: settings, text_blocks, images, beers, menu_items, menu_pages, gallery_images, review_quotes, review_stats — **todas con `visible` default true** donde aplique texto/imagen.

## 5. Módulos admin MVP
Textos | Menú | Cervezas | Galería | Reseñas | Publicar — cada campo texto/imagen con checkbox Mostrar.

## 6. Fases
0 Decisiones abiertas → 1 Schema+seed+visible → 2 API+R2+Access → 3 Admin UI → 4 Sitio filtra visible + Publicar → 5 QA/docs → 6 cutover luego

## 7. Fuera de MVP
Checkout, multi-local, roles ricos, fake Google reviews, i18n

## 8. Decisiones abiertas
1. Monorepo vs repo admin  2. `/admin` vs subdominio  3. Drive→R2 en MVP o después  
**Default propuesto:** monorepo, `/admin`+Access, R2 en MVP.

## 9. Riesgos
Auth leakage, unpublish accidental, rebuild lag, cream token gotcha — mitigaciones en plan completo.

## 10. Éxito
Mostrar=false en cerveza + línea hero → desaparecen tras Publicar; true las restaura. Prod legacy intacto.
