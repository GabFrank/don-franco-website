# Don Franco v2 - Brief Greenfield

## Objetivo

Reescritura completa del sitio web en rama limpia (`feat/v2-greenfield`) usando Astro 7, nueva paleta de colores "Brewery Ember", y sistema flexible de modos de menú.

**No mergear a main. No deployar a producción.**

## Paleta "Brewery Ember"

Reemplaza negro/dorado con calidez industrial-rústica:

```css
--color-bg:        #1A1614;  /* carbón cálido */
--color-surface:   #2C2520;  /* superficie oscura */
--color-surface-2: #3D342C;  /* superficie elevada */
--color-text:      #FAF3E8;  /* texto crema */
--color-muted:     #A89888;  /* texto secundario */
--color-accent:    #E85D04;  /* ember - CTAs principales */
--color-accent-2:  #F0A202;  /* amber - highlights cerveza */
--color-craft:     #3D5A45;  /* sage - badges artesanal */
--color-border:    #3D342C;  /* bordes sutiles */
```

## Sistema de Modos de Menú

El archivo `content/site.json` soporta tres modos:

```json
"menu": {
  "mode": "png",
  "modes": {
    "png": {
      "enabled": true,
      "source": "menu-pages.json"
    },
    "digital": {
      "enabled": false,
      "source": "menu-digital.json"
    }
  }
}
```

### Modos soportados:

- **`png`**: Visor mejorado de páginas PNG desde Google Drive (por defecto)
- **`digital`**: Menú estructurado con categorías/items/precios desde `menu-digital.json`
- **`both`**: Tabs/toggle para elegir entre PNG y digital

**Cambiar el modo**: editar `content/site.json` → `menu.mode` → rebuild

## Arquitectura

### Mantener / Portar:
- ✅ `content/site.json` (historia, teléfono +595983327600, WhatsApp 595983327600, dirección, horarios, socials, Drive folder IDs)
- ✅ `content/menu-pages.json`
- ✅ `src/lib/drive.ts` y `places.ts` (adaptados a Astro 7)
- ✅ `public/logo.*`, `favicon.svg`, `robots.txt`, `sitemap.xml`
- ✅ `.github/workflows/deploy.yml` (ajustar si necesario para Astro 7)
- ✅ `docs/` (agregar este BRIEF-V2.md)

### Eliminar:
- ❌ Componentes viejos (Hero con ghost text, galería horizontal scrollbar)
- ❌ Paleta negro/dorado (`#c8a96a`)
- ❌ `public/config/` como source duplicado
- ❌ `content/menu-index.json` (no usado actualmente)

### Crear:
- ✨ `content/menu-digital.json` con sample data (hamburguesas, pizzas, bebidas)
- ✨ Componentes nuevos mobile-first con Brewery Ember
- ✨ Menú fullscreen mejorado con lightbox para PNG
- ✨ Galería CSS grid (no scroll horizontal infinito)

## Secciones de la Página

1. **Header**: Logo, nav, menú mobile con close claro
2. **Hero**: Full-bleed, 1 CTA primario "Ver menú" (ember), 1 secundario "Reservar WhatsApp"
3. **Historia**: Texto de `story.paragraphs`
4. **Menú**: Respeta `menu.mode` (png/digital/both)
5. **Galería**: Grid CSS + lightbox (NO horizontal strip)
6. **Reviews**: Card con rating + link a Maps
7. **Contacto**: Info + mapa embed (si `embedUrl` disponible)
8. **Footer**: Info legal + WhatsApp float

## Principios Técnicos

- **Mobile-first**: Touch targets ≥44px
- **Astro 7**: Usar latest features
- **Performance**: `npm run build` debe pasar sin errores
- **Git**: Commits convencionales, branch limpia, NO force-push

## Datos de Ejemplo `menu-digital.json`

```json
{
  "categories": [
    {
      "id": "hamburguesas",
      "name": "Hamburguesas",
      "description": "Burgers artesanales con carne premium",
      "items": [
        {
          "id": "classic",
          "name": "Don Franco Classic",
          "description": "Carne 180g, cheddar, lechuga, tomate, cebolla",
          "price": 45000,
          "currency": "Gs.",
          "image": {
            "fileId": "1Aea-cwx1nz5k0qhProcCUTHgtqPxWD7p"
          }
        }
      ]
    },
    {
      "id": "pizzas",
      "name": "Pizzas",
      "items": []
    },
    {
      "id": "bebidas",
      "name": "Bebidas",
      "items": [
        {
          "id": "cerveza-artesanal",
          "name": "Cerveza Artesanal Don Franco",
          "description": "IPA, Lager, Stout",
          "price": 18000,
          "currency": "Gs."
        }
      ]
    }
  ]
}
```

## Workflow Git

1. Crear branch: `git checkout -b cursor/feat-v2-greenfield-8e75`
2. Commits lógicos: `feat: add brewery ember palette`, `feat: implement menu modes`, etc.
3. Push: `git push -u origin cursor/feat-v2-greenfield-8e75`
4. PR draft contra `main` con título: **"feat: Don Franco v2 greenfield (Brewery Ember)"**
5. **NO mergear** - PR solo para revisión

## Estado Actual

- ⏳ Desarrollo en progreso
- 🚧 No listo para producción
- 📋 Falta completar: placeId, embedUrl (opcional)

## Deploy

El workflow `.github/workflows/deploy.yml` usa rsync a Digital Ocean. Verificar compatibilidad con Astro 7 build output antes de deploy real (no hacer deploy desde esta rama).

---

**Contacto**: +595983327600 | WhatsApp: 595983327600 | [Instagram](https://www.instagram.com/donfrancobs)
