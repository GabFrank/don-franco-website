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

// GET /api/settings - Listar todos
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const result = await env.DB
    .prepare('SELECT * FROM settings ORDER BY key')
    .all<Setting>();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

