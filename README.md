# Don Franco | Restaurante Artesanal

Sitio institucional de una sola página: menú (imágenes A4 desde Google Drive), historia, galería, valoraciones, contacto y mapa. Despliegue estático en DigitalOcean con CI/CD desde GitHub.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí [http://localhost:4321](http://localhost:4321).

## Build

```bash
npm run build
```

La salida queda en `dist/`.

## Estructura del proyecto

- `src/pages/index.astro` — Página principal.
- `src/components/` — Hero, MenuSection, StorySection, GallerySection, ReviewsSection, ContactSection, MapSection, Footer, Header.
- `src/styles/` — Tokens de marca y estilos globales.
- `src/lib/drive.ts` — Utilidades para URLs de Google Drive.
- `src/types/menu.ts` — Tipos del menú.
- `content/menu-index.json` — Índice del menú (categorías e ítems con `fileId` de Drive).
- `public/` — Logo, favicon, robots.txt, sitemap, fallback para imágenes del menú.
- `ops/` — Configuración Nginx y guía de deploy.

## Documentación

- [Requisitos y guía técnica](docs/PROJECT_REQUIREMENTS.md)
- [Runbook: actualización de contenido](docs/CONTENT_UPDATE_RUNBOOK.md)
- [Deploy en DigitalOcean](ops/deploy/README.md)

## Deploy

El push a `main` dispara el workflow de GitHub Actions que hace build y sube `dist/` al Droplet por SSH/rsync. Secrets necesarios: `DO_HOST`, `DO_USER`, `DO_PORT` (opcional), `SSH_PRIVATE_KEY`, `KNOWN_HOSTS`, `DEPLOY_PATH`.

## Licencia

Privado / Don Franco.
