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

    // Generar key único
    const ext = file.name.split('.').pop() || '';
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
