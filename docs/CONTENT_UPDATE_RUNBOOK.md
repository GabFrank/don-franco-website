# Runbook: actualización de contenido

## Actualizar el menú (imágenes A4 PNG)

1. **Subir imágenes a Google Drive**
   - Entrá a la carpeta del sitio (ej. `DON_FRANCO_SITE/MENU/PARRILLAS/`).
   - Subí los PNG en formato A4.
   - Nombre sugerido: `YYYYMMDD_categoria_slug_v01.png`.

2. **Obtener el ID de cada archivo**
   - Abrí el archivo en Drive → Compartir → “Cualquier persona con el enlace”.
   - El enlace tiene la forma: `https://drive.google.com/file/d/FILE_ID/view`.
   - Copiá el `FILE_ID` (la parte entre `/d/` y `/view`).

3. **Editar el índice del menú**
   - En el repo, editá `content/menu-index.json`.
   - Mantené la estructura: `categories[]` → cada categoría tiene `id`, `title`, `order`, `items[]`.
   - Cada ítem tiene: `id`, `title`, `description` (opcional), `image` con `fileId` y opcionalmente `url`, `alt` (obligatorio), `isFeatured` (opcional).
   - Para construir la URL solo con `fileId`: `https://drive.google.com/uc?export=view&id=FILE_ID`.

4. **Probar en local**
   - `npm run dev` y revisar la sección Menú.
   - Comprobá que las imágenes carguen (o que se vea el placeholder si el ID es de prueba).

5. **Publicar**
   - Creá una rama, commit y abrí un Pull Request.
   - Revisá el diff del JSON.
   - Merge a `main`. El deploy se ejecuta automáticamente (GitHub Actions).

## Actualizar galería

- Si la galería se alimenta por JSON (por ejemplo en un futuro `content/gallery-index.json`), el flujo es el mismo: subir fotos a Drive, copiar IDs, editar el JSON, PR y merge a `main`.

## Checklist pre-deploy (antes de merge a main)

- [ ] La Home carga bien en móvil y desktop.
- [ ] El CTA “Ver menú” lleva a la sección del menú.
- [ ] Las URLs de Drive en el JSON son correctas (probadas en el navegador).
- [ ] No hay imágenes rotas ni `alt` vacíos en el menú.
- [ ] Mapa y enlaces de contacto (teléfono, WhatsApp) funcionan.

## Checklist post-deploy

- [ ] El sitio en producción responde (HTTPS si está configurado).
- [ ] Certificado SSL válido (si aplica).
- [ ] Lighthouse móvil: Performance > 80, SEO > 90, Accessibility > 85 (objetivo).
- [ ] Revisar logs de Nginx si algo falla: `sudo journalctl -u nginx -n 50`.

## Rollback

Si el deploy deja el sitio roto, ver [ops/deploy/README.md](../ops/deploy/README.md#rollback): cambiar el symlink `current` a la release anterior y recargar Nginx.
