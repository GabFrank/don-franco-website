/**
 * Proxy para servir archivos de R2
 * GET /media/*
 * 
 * Catch-all route para servir archivos con múltiples segmentos (ej: /media/images/foo.png)
 * Valida que el objeto pertenece a contenido visible antes de servir
 * (para MVP - puede servir sin validación y confiar en URLs privadas)
 */

import type { Env } from '../_shared/auth';
import { jsonResponse } from '../_shared/db-helpers';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;

  const keyParam = params.key;
  const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam as string;
  
  if (!key) {
    return jsonResponse({ error: 'Missing key parameter' }, 400);
  }

  try {
    // Obtener objeto de R2
    const object = await env.R2_BUCKET.get(key);

    if (!object) {
      return jsonResponse({ error: 'File not found' }, 404);
    }

    // OPCIONAL: Validar que el objeto pertenece a contenido visible
    // Para MVP, podemos omitir esta validación y confiar en que las URLs no son públicas
    
    // Retornar archivo
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
      },
    });
  } catch (error) {
    console.error('[media] GET error:', error);
    return jsonResponse({ error: 'Failed to fetch file' }, 500);
  }
};
