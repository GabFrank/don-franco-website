/**
 * Generar presigned URL para upload a R2
 * POST /api/r2/upload-url
 * 
 * Body: { filename: string, contentType?: string }
 * Response: { uploadUrl: string, r2Key: string, expiresIn: number }
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
    const body = await request.json() as { filename: string; contentType?: string; folder?: string };

    if (!body.filename) {
      return jsonResponse({ error: 'Missing required field: filename' }, 400);
    }

    // Generar key único en R2
    const folder = body.folder || 'uploads';
    const ext = body.filename.split('.').pop() || '';
    const r2Key = `${folder}/${nanoid(12)}.${ext}`;

    // Generar presigned URL (válida por 1 hora)
    // NOTA: R2 presigned URLs requieren AWS SDK o librería compatible
    // Para MVP simple, retornamos el r2Key y el admin hace upload directo via API
    
    // Por ahora retornamos información para que el cliente sepa dónde subir
    // En producción, esto debería generar una presigned URL real con AWS SDK
    
    return jsonResponse({
      message: 'Upload endpoint - implementar presigned URL con AWS SDK',
      r2Key,
      uploadMethod: 'POST /api/r2/upload con FormData',
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('[r2/upload-url] POST error:', error);
    return jsonResponse({ error: 'Failed to generate upload URL' }, 500);
  }
};
