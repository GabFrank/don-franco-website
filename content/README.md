# Contenido del sitio

## Textos y datos (site.json)

En `site.json` se configuran todos los textos y datos del sitio: nombre, descripción del hero, historia (título y párrafos), galería (título e intro), valoraciones (título, rating, enlace), contacto (teléfono, WhatsApp, dirección, horarios, etiquetas), mapa (título, enlace) y footer (tagline, redes, texto legal). Editando ese archivo podés cambiar los textos sin tocar código.

**Carrusel del hero:** en `hero.backgroundImages` podés agregar un array de URLs de imágenes (por ejemplo desde Drive). Esas imágenes se usan como fondo del hero en rotación, con un overlay oscuro para que el texto siga legible. `hero.backgroundImageDuration` es la cantidad de segundos que se muestra cada imagen (por defecto 5). Si el array está vacío, el hero usa fondo liso.

## Menú (menu-pages.json)

Las imágenes del menú se listan en `menu-pages.json`. En cada entrada podés usar:

- **url**: la URL completa del archivo en Drive (recomendado). Ejemplo: `https://drive.google.com/file/d/1Aea-cwx1nz5k0qhProcCUTHgtqPxWD7p/view?usp=drive_link`
- **fileId**: solo el ID del archivo (la parte entre `/d/` y `/view` en el enlace de Drive). Ejemplo: `1Aea-cwx1nz5k0qhProcCUTHgtqPxWD7p`

Con **url** basta con copiar el enlace que da Drive al compartir (Compartir → Copiar enlace). El sitio convierte ese enlace a la URL directa de la imagen.

El orden de las páginas en el visor es el mismo que el orden del array `pages` en el JSON.
