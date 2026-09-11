/**
 * CRUD endpoints para beers
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

interface Beer {
  id: string;
  name: string;
  style: string | null;
  notes: string | null;
  image_id: string | null;
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
  const includeHidden = url.searchParams.get('includeHidden') === 'true';
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

  let query = `
    SELECT b.*, i.r2_key as image_r2_key, i.visible as image_visible
    FROM beers b
    LEFT JOIN images i ON b.image_id = i.id
  `;
  const conditions: string[] = [];

  if (!includeHidden) {
    conditions.push('b.visible = 1');
  }

  if (!includeDeleted) {
    conditions.push('b.deleted_at IS NULL');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY b.sort_order, b.created_at';

  const result = await env.DB.prepare(query).all();

  return jsonResponse({ items: result.results || [], count: result.results?.length || 0 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json() as Partial<Beer>;

    if (!body.name) {
      return jsonResponse({ error: 'Missing required field: name' }, 400);
    }

    const id = generateId();
    const timestamp = now();

    await env.DB
      .prepare(`
        INSERT INTO beers (id, name, style, notes, image_id, visible, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.name,
        body.style || null,
        body.notes || null,
        body.image_id || null,
        body.visible ?? 1,
        body.sort_order ?? 0,
        timestamp,
        timestamp
      )
      .run();

    const created = await env.DB
      .prepare('SELECT * FROM beers WHERE id = ?')
      .bind(id)
      .first<Beer>();

    return jsonResponse(created, 201);
  } catch (error) {
    console.error('[beers] POST error:', error);
    return jsonResponse({ error: 'Failed to create beer' }, 500);
  }
};

