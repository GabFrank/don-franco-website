/**
 * CRUD endpoints para settings (key-value store)
 * GET /api/settings - Listar todos
 * GET /api/settings/:key - Obtener uno
 * PUT /api/settings/:key - Actualizar/crear
 * DELETE /api/settings/:key - Eliminar
 */

import { requireAuth, type Env } from '../_shared/auth';
import { now, jsonResponse, corsOptions } from '../_shared/db-helpers';

interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: number;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

// GET /api/settings - Listar todos o uno específico
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;

  if (params.key) {
    const setting = await env.DB
      .prepare('SELECT * FROM settings WHERE key = ?')
      .bind(params.key as string)
      .first<Setting>();

    if (!setting) {
      return jsonResponse({ error: 'Setting not found' }, 404);
    }

    return jsonResponse(setting);
  }

  const result = await env.DB
    .prepare('SELECT * FROM settings ORDER BY key')
    .all<Setting>();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

// PUT /api/settings/:key - Upsert (crear o actualizar)
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
    const body = await request.json() as Partial<Setting>;

    if (!body.value) {
      return jsonResponse({ error: 'Missing required field: value' }, 400);
    }

    // Upsert: INSERT OR REPLACE
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
      .first<Setting>();

    return jsonResponse(updated);
  } catch (error) {
    console.error('[settings] PUT error:', error);
    return jsonResponse({ error: 'Failed to update setting' }, 500);
  }
};

// DELETE /api/settings/:key - Eliminar
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
