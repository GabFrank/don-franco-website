# Galería automática desde carpeta de Google Drive

Esta implementación permite que la sección **Galería** tome imágenes directamente desde una **carpeta de Google Drive**, sin cargar links individuales en `content/site.json`.

## Cómo funciona

- En cada build, el sitio consulta Google Drive API v3 y lista imágenes dentro de una carpeta configurada.
- Las imágenes se ordenan por fecha de creación descendente (`createdTime desc`).
- Cada imagen se muestra en la galería con enlace al archivo en Drive.
- El texto `alt` se genera automáticamente desde el nombre del archivo.
- Si el workflow corre cada hora (cron), las nuevas fotos subidas a la carpeta aparecen automáticamente en el sitio.

## Requisitos

1. Carpeta de Drive con imágenes.
2. Carpeta compartida con permiso:
   - **Cualquier persona con el enlace** (lector).
3. API key de Google Cloud con Google Drive API habilitada.

## Configuración de Google Cloud (una vez)

1. Crear proyecto en Google Cloud Console.
2. Habilitar API:
   - **Google Drive API**
3. Crear credencial:
   - **API key**
4. Recomendado:
   - En la API key, dejar restricción por API en **Google Drive API**.
   - No usar restricciones por IP para este caso (GitHub Actions usa IPs variables).

## Configuración en el repo

### 1) Secret en GitHub Actions

Crear secret:

- `GDRIVE_API_KEY`: valor de la API key de Google Cloud.

Ruta: **Repo → Settings → Secrets and variables → Actions → New repository secret**.

### 2) Configurar carpetas en `content/site.json`

**Galería** (sección de fotos):

```json
"gallery": {
  "title": "GALERÍA",
  "intro": "Un vistazo a nuestro espacio y platos.",
  "emptyMessage": "Las fotos de la galería se configuran desde Drive.",
  "folderUrl": "https://drive.google.com/drive/folders/TU_FOLDER_ID",
  "limit": 12
}
```

También se acepta `folderId` (sin URL completa):

```json
"folderId": "TU_FOLDER_ID"
```

**Carousel del Hero** (fondo del banner principal): en `hero` podés usar una carpeta de Drive para las imágenes del carousel en lugar de listar `backgroundImages` a mano:

```json
"hero": {
  "title": "DON FRANCO",
  "carouselFolderUrl": "https://drive.google.com/drive/folders/ID_DE_LA_CARPETA",
  "carouselLimit": 10,
  "backgroundImageDuration": 5
}
```

Si `carouselFolderUrl` está definido y hay `GDRIVE_API_KEY`, las imágenes del carousel se cargan automáticamente desde esa carpeta (ordenadas por fecha). Si no, se usan las URLs de `backgroundImages`.

## Actualización automática

El workflow de deploy está configurado para correr:

- en cada `push` a `main`
- y cada hora (cron en UTC)

Con eso, al subir una imagen nueva a la carpeta de Drive, aparecerá sola en la web en la siguiente ejecución programada.

## Fallback

Si falta `GDRIVE_API_KEY`, si la carpeta no es válida o si hay error en la API:

- la galería usa `gallery.images` (si existe en `content/site.json`);
- si tampoco hay imágenes configuradas, muestra `emptyMessage`.
