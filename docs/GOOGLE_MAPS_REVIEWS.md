# Valoraciones desde Google Maps (Place Details)

La sección **"Lo que dicen nuestros clientes"** puede mostrar la **calificación** y el **número de valoraciones** que tiene tu negocio en Google Maps, obtenidos en cada build con la **Places API (Place Details)**.

## Requisitos

- **Place ID** de tu negocio en Google Maps / Google Business.
- **API key** de Google Cloud con **Places API** habilitada.

## Cómo obtener el Place ID

1. **Desde el buscador de Place ID de Google**
   - Entrá a: [Place ID – Places API](https://developers.google.com/maps/documentation/places/web-service/place-id).
   - Buscá la sección **"Find place ID"** o usá la herramienta: [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id#find-id).
   - Escribí el nombre del negocio (ej. "Don Franco Restaurante") y la ubicación. Elegí el resultado correcto y copiá el **Place ID** (ej. `ChIJ...`).

2. **Desde Google Maps**
   - Abrí tu negocio en Google Maps (por ejemplo desde el enlace que ya tenés: `https://maps.app.goo.gl/...`).
   - En la barra de direcciones a veces aparece un identificador. O compartí el lugar y en la URL larga puede aparecer `place_id` o un CID; con el CID podés buscar el Place ID en herramientas de terceros si hace falta.

El Place ID es una cadena que suele empezar por `ChIJ` (ej. `ChIJN1t_tDeuEmsRUsoyG83frY4`).

## Configuración en Google Cloud

1. En el mismo proyecto de Google Cloud donde tenés la API key (o en uno nuevo):
   - **APIs y servicios → Biblioteca** → buscá **"Places API"** → habilitar.
2. La misma **API key** que uses para el sitio (o una nueva) debe tener **Places API** permitida. Si usás una key restringida por API, añadí **Places API** a la lista.

## Configuración en el repo

### 1) Secret en GitHub Actions

Crear un secret con la API key que tenga Places API habilitada:

- **Nombre:** `PLACES_API_KEY` (o `GOOGLE_PLACES_API_KEY`).
- **Valor:** la API key.

Si ya tenés una key que use solo Drive, podés crear otra key para Places o habilitar Places API en la misma key y usar ese valor también (por ejemplo en `PLACES_API_KEY`).

### 2) Pasar la key al build

El workflow de deploy ya pasa `PLACES_API_KEY` al paso de build. Solo hace falta crear el secret en GitHub (ver arriba).

### 3) Configurar el Place ID en `content/site.json`

En la sección `reviews`:

```json
"reviews": {
  "title": "LO QUE DICEN NUESTROS CLIENTES",
  "placeId": "ChIJ...",
  "rating": 4.8,
  "reviewCount": 120,
  "linkText": "Ver en Google Maps",
  "mapsUrl": "https://maps.app.goo.gl/AcTKAKwEb1h9hc4K9"
}
```

- **placeId:** el Place ID de tu negocio. Si está vacío o no está, se usan los valores fijos `rating` y `reviewCount`.
- **rating** y **reviewCount:** se usan como respaldo si no hay API key, no hay Place ID o la API falla.

## Comportamiento

- En cada **build** (push a `main` o cron), si existen `PLACES_API_KEY` y `reviews.placeId`, se llama a Place Details con `fields=rating,user_ratings_total`.
- Si la respuesta es correcta, la sección muestra esa **calificación** y **cantidad de valoraciones**.
- Si algo falla (key, placeId, red, etc.), se muestran los valores de `rating` y `reviewCount` del JSON.

## Precios

Place Details se factura por solicitud; los campos `rating` y `user_ratings_total` entran en la categoría "Atmosphere". Google ofrece crédito gratuito mensual. Ver [Precios de Places API](https://developers.google.com/maps/billing-and-pricing/pricing).
