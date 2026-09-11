/**
 * Dynamic route handler para /api/settings/:key
 * GET /api/settings/:key - Obtener un setting
 * PUT /api/settings/:key - Actualizar/crear un setting (upsert)
 * DELETE /api/settings/:key - Eliminar un setting
 */

import { type Env } from '../../_shared/auth';
import { corsOptions } from '../../_shared/db-helpers';
import { handleGetById, handleDeleteById } from '../../_shared/crud-helpers';
import { requireAuth } from '../../_shared/auth';
import { jsonResponse, now } from '../../_shared/db-helpers';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return handleGetById(context, {
    tableName: 'settings',
    paramKey: 'key',
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const key = params.key as string;
  if (!key) {
    return jsonResponse({ error: 'Missing key parameter' }, 400);
  }

  try {
    const body = await request.json() as { value: string; description?: string };

    if (!body.value) {
      return jsonResponse({ error: 'Missing required field: value' }, 400);
    }

    await env.DB
      .prepare(`
        INSERT INTO settings (key, value, description, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          description = excluded.description,
          updated_at = excluded.updated_at
      `)
      .bind(key, body.value, body.description || null, now())
      .run();

    const updated = await env.DB
      .prepare('SELECT * FROM settings WHERE key = ?')
      .bind(key)
      .first();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[settings] PUT error:', error);
    return jsonResponse({ error: 'Failed to update setting' }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  const key = params.key as string;
  if (!key) {
    return jsonResponse({ error: 'Missing key parameter' }, 400);
  }

  try {
    const result = await env.DB
      .prepare('DELETE FROM settings WHERE key = ?')
      .bind(key)
      .run();

    if (result.meta.changes === 0) {
      return jsonResponse({ error: 'Setting not found' }, 404);
    }

    return jsonResponse({ message: 'Setting deleted' });
  } catch (error) {
    console.error('[settings] DELETE error:', error);
    return jsonResponse({ error: 'Failed to delete setting' }, 500);
  }
};
