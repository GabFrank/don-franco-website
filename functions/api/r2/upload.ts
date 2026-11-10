/**
 * Upload directo a R2
 * POST /api/r2/upload
 * 
 * Multipart form data: file + folder (opcional)
 * Response: { r2Key: string, url: string }
 */

import { requireAuth, type Env } from '../../_shared/auth';
import { jsonResponse, corsOptions } from '../../_shared/db-helpers';
import { nanoid } from 'nanoid';

// Solo imágenes: /media/ se sirve desde el mismo origen que el admin (evita subir HTML/JS)
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const FOLDER_PATTERN = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i;

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Validar autenticación
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return jsonResponse({ error: 'Missing file in form data' }, 400);
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return jsonResponse({ error: 'Unsupported file type (only jpeg, png, webp, gif, avif)' }, 400);
    }

    if (!FOLDER_PATTERN.test(folder)) {
      return jsonResponse({ error: 'Invalid folder' }, 400);
    }

    // Generar key único
    const r2Key = `${folder}/${nanoid(12)}.${ext}`;

    // Subir a R2
    await env.R2_BUCKET.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return jsonResponse({
      r2Key,
      filename: file.name,
      size: file.size,
      contentType: file.type,
      url: `/media/${r2Key}`,
    }, 201);
  } catch (error) {
    console.error('[r2/upload] POST error:', error);
    return jsonResponse({ error: 'Failed to upload file' }, 500);
  }
};
