/**
 * CRUD endpoints para images
 * GET /api/images - Listar
 * GET /api/images/:id - Obtener uno
 * POST /api/images - Crear (con metadata, upload R2 separado)
 * PUT /api/images/:id - Actualizar metadata
 * DELETE /api/images/:id - Soft delete
 */

import { requireAuth, type Env } from '../_shared/auth';
import {
  generateId,
  now,
  softDelete,
  hardDelete,
  jsonResponse,
  corsOptions,
} from '../_shared/db-helpers';

interface Image {
  id: string;
  key: string;
  section: string;
  r2_key: string;
  alt: string | null;
  visible: number;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return corsOptions();
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const url = new URL(request.url);
  const section = url.searchParams.get('section');
  const includeHidden = url.searchParams.get('includeHidden') === 'true';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

  let query = 'SELECT * FROM images';
  const conditions: string[] = [];
  const bindings: any[] = [];

  if (section) {
    conditions.push('section = ?');
    bindings.push(section);
  }

  if (!includeHidden) {
    conditions.push('visible = 1');
  }

  if (!includeDeleted) {
    conditions.push('deleted_at IS NULL');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY section, sort_order, created_at';

  const stmt = env.DB.prepare(query);
  const result = await (bindings.length > 0 ? stmt.bind(...bindings) : stmt).all<Image>();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<Image>;

    if (!body.key || !body.section || !body.r2_key) {
      return jsonResponse({ error: 'Missing required fields: key, section, r2_key' }, 400);
    }

    // Verificar que key no existe
    const existing = await env.DB
      .prepare('SELECT id FROM images WHERE key = ?')
      .bind(body.key)
      .first();

    if (existing) {
      return jsonResponse({ error: 'Image with this key already exists' }, 409);
    }

    const id = generateId();
    const timestamp = now();

    await env.DB
      .prepare(`
        INSERT INTO images (id, key, section, r2_key, alt, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.key,
        body.section,
        body.r2_key,
        body.alt || null,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();

    const created = await env.DB
      .prepare('SELECT * FROM images WHERE id = ?')
      .bind(id)
      .first<Image>();

    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[images] POST error:', error);
    return jsonResponse({ error: 'Failed to create image' }, 500);
  }
};

