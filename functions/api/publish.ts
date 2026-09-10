/**
 * Endpoint de publicación
 * POST /api/publish - Crear entrada en publish_log y trigger deploy hook
 * GET /api/publish - Obtener log de publicaciones
 */

import { requireAuth, type Env } from '../_shared/auth';
import { generateId, now, jsonResponse, corsOptions } from '../_shared/db-helpers';

interface PublishLog {
  id: string;
  user_email: string;
  status: 'pending' | 'building' | 'completed' | 'failed';
  webhook_response: string | null;
  created_at: number;
  completed_at: number | null;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

// GET /api/publish - Listar publicaciones recientes
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const result = await env.DB
      .prepare('SELECT * FROM publish_log ORDER BY created_at DESC LIMIT 20')
      .all<PublishLog>();

    return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
  } catch (error) {
    console.error('[publish] GET error:', error);
    return jsonResponse({ error: 'Failed to fetch publish log' }, 500);
  }
};

// POST /api/publish - Iniciar publicación
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Validar autenticación
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const userEmail = authResult.email;

  try {
    const id = generateId();
    const timestamp = now();

    // Crear entrada en publish_log
    await env.DB
      .prepare(`
        INSERT INTO publish_log (id, user_email, status, created_at)
        VALUES (?, ?, 'pending', ?)
      `)
      .bind(id, userEmail, timestamp)
      .run();

    // Si hay deploy hook configurado, llamarlo
    let webhookResponse = null;
    let status: PublishLog['status'] = 'pending';

    if (env.CF_PAGES_DEPLOY_HOOK_URL) {
      try {
        const hookResponse = await fetch(env.CF_PAGES_DEPLOY_HOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        webhookResponse = JSON.stringify({
          status: hookResponse.status,
          statusText: hookResponse.statusText,
          body: await hookResponse.text(),
        });

        status = hookResponse.ok ? 'building' : 'failed';
      } catch (error) {
        webhookResponse = JSON.stringify({
          error: error instanceof Error ? error.message : 'Webhook call failed',
        });
        status = 'failed';
      }

      // Actualizar publish_log con respuesta del webhook
      await env.DB
        .prepare(`
          UPDATE publish_log
          SET status = ?, webhook_response = ?, completed_at = ?
          WHERE id = ?
        `)
        .bind(status, webhookResponse, now(), id)
        .run();
    } else {
      console.warn('[publish] CF_PAGES_DEPLOY_HOOK_URL not configured');
    }

    const created = await env.DB
      .prepare('SELECT * FROM publish_log WHERE id = ?')
      .bind(id)
      .first<PublishLog>();

    return jsonResponse({
      ...created,
      message: env.CF_PAGES_DEPLOY_HOOK_URL
        ? 'Publicación iniciada. El deploy puede tardar 1-2 minutos.'
        : 'Entrada de publicación creada, pero CF_PAGES_DEPLOY_HOOK_URL no está configurado.',
    }, 201);
  } catch (error) {
    console.error('[publish] POST error:', error);
    return jsonResponse({ error: 'Failed to create publish entry' }, 500);
  }
};
